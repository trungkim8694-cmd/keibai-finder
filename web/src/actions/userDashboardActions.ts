'use server';

import { prisma } from '@/lib/prisma';

export async function getUserFavorites(userId: string) {
  if (!userId) return [];
  
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { created_at: 'desc' }
  });

  const propertyIds = favorites.map(f => f.sale_unit_id);
  
  if (propertyIds.length === 0) return [];

  const properties = await prisma.property.findMany({
    where: { sale_unit_id: { in: propertyIds } },
    include: {
      auction_events: true,
      auction_history: true
    }
  });

  // Re-order properties to match the exact sorting of favorites (newest favorited first)
  // If property is dead (not in DB), property is undefined -> we pass null to allow UI rendering 'removed' card
  return propertyIds.map(id => {
    const p = properties.find(prop => prop.sale_unit_id === id) || null;
    const fav = favorites.find(f => f.sale_unit_id === id);
    return {
      propertyId: id,
      property: p,
      favoritedAt: fav?.created_at
    };
  });
}

export async function removeFavorite(userId: string, sale_unit_id: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    await prisma.favorite.delete({
      where: {
        userId_sale_unit_id: { userId, sale_unit_id }
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return { success: false, error: '削除に失敗しました' };
  }
}

export async function addFavorite(userId: string, sale_unit_id: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    // Check limit
    const count = await prisma.favorite.count({ where: { userId } });
    if (count >= 20) {
      return { success: false, error: 'LIMIT_REACHED' };
    }

    await prisma.favorite.create({
      data: {
        userId,
        sale_unit_id
      }
    });
    return { success: true };
  } catch (error: any) {
    // If it's a unique constraint error (P2002), silently succeed to be robust
    if (error?.code === 'P2002') return { success: true };
    console.error('Failed to add favorite:', error);
    return { success: false, error: '登録に失敗しました' };
  }
}
