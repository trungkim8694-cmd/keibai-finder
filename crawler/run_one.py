import asyncio
from playwright.async_api import async_playwright
import os, sys, json
import psycopg2

sys.path.append("/Users/kimtrung/keibai-finder/crawler")

import advanced_crawler

async def test():
    # Patch main to only scrape the one the user sees
    print("Testing 1 property...")
    # Actually just telling the user is better, but let's run the DB crawler real quick on Iwaki area.
    pass

