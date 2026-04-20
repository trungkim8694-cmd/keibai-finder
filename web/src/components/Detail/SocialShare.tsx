'use client';

import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Share2, Link, Check, Mail } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShareDropdown({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy...', err);
    }
  };

  const menuItems = [
    {
       name: 'LINE',
       href: shareLinks.line,
       icon: (
          <svg viewBox="0 0 24 24" fill="#06C755" className="w-4 h-4">
            <path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.601 10.04 9.351.391.084.923.258 1.058.594.121.303.079.778.039 1.085l-.171 1.026c-.052.308-.252 1.206 1.088.658 1.339-.548 7.232-4.259 9.854-7.29 1.748-2.023 2.099-3.593 2.1-5.424zm-16.711 5.372h-1.637c-.31 0-.563-.253-.563-.563v-4.14c0-.31.253-.563.563-.563s.563.253.563.563v3.578h1.074c.31 0 .563.253.563.563s-.253.562-.563.562zm3.336-.563c0 .31-.253.563-.563.563s-.563-.253-.563-.563v-4.14c0-.31.253-.563.563-.563s.563.253.563.563v4.14zm5.556 0c0 .149-.059.292-.165.397l-1.921 1.931c-.105.106-.247.165-.397.165s-.292-.059-.397-.165l-1.921-1.931c-.106-.105-.165-.248-.165-.397v-3.577c0-.31.253-.563.563-.563s.563.253.563.563v3.014l1.358-1.365c.105-.106.248-.165.397-.165s.292.059.397.165l1.358 1.365v-3.014c0-.31.253-.563.563-.563s.563.253.563.563v3.577zm4.773-1.427c.31 0 .563.253.563.563s-.253.563-.563.563h-1.074v.562c0 .31-.253.563-.563.563s-.563-.253-.563-.563v-1.125c0-.15.06-.293.165-.398s.248-.165.398-.165h1.637zm0-1.745c.31 0 .563.253.563.563s-.253.563-.563.563h-1.637c-.31 0-.563-.253-.563-.563v-1.125c0-.31.253-.563.563-.563s.563.253.563.563v.562h1.074z"/>
            </svg>
       )
    },
    {
       name: 'X (Twitter)',
       href: shareLinks.x,
       icon: (
           <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
           </svg>
       )
    },
    {
       name: 'Facebook',
       href: shareLinks.facebook,
       icon: (
           <svg viewBox="0 0 24 24" fill="#1877F2" className="w-4 h-4">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
           </svg>
       )
    },
    {
       name: 'Gmail',
       href: shareLinks.gmail,
       icon: <Mail className="w-4 h-4 text-red-500" />
    }
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          className="relative rounded-full flex items-center justify-center transition-all duration-300 group shrink-0 bg-black/30 backdrop-blur-sm border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-black/40 hover:scale-110 outline-none focus:outline-none w-[36px] h-[36px]" 
          title="共有"
        >
          <Share2 className="w-[20px] h-[20px] text-white/60 drop-shadow-md group-hover:text-white transition-colors" strokeWidth={2.5} />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-zinc-800 focus:outline-none z-50 overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
          <div className="py-1">
            {menuItems.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }) => (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      active ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'
                    } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors`}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                )}
              </Menu.Item>
            ))}
          </div>
          <div className="py-1">
            <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleCopyLink}
                    className={`${
                      active ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'
                    } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors`}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                    {copied ? 'コピーしました' : 'リンクをコピー'}
                  </button>
                )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
