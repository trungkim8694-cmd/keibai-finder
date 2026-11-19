'use client';

import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Share2, Link as LinkIcon, Check, Mail } from 'lucide-react';

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
       name: 'LINEで共有',
       href: shareLinks.line,
       icon: (
          <svg viewBox="0 0 24 24" fill="#06C755" className="w-3.5 h-3.5 shrink-0">
            <path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.601 10.04 9.351.391.084.923.258 1.058.594.121.303.079.778.039 1.085l-.171 1.026c-.052.308-.252 1.206 1.088.658 1.339-.548 7.232-4.259 9.854-7.29 1.748-2.023 2.099-3.593 2.1-5.424zm-16.711 5.372h-1.637c-.31 0-.563-.253-.563-.563v-4.14c0-.31.253-.563.563-.563s.563.253.563.563v3.578h1.074c.31 0 .563.253.563.563s-.253.562-.563.562zm3.336-.563c0 .31-.253.563-.563.563s-.563-.253-.563-.563v-4.14c0-.31.253-.563.563-.563s.563.253.563.563v4.14zm5.556 0c0 .149-.059.292-.165.397l-1.921 1.931c-.105.106-.247.165-.397.165s-.292-.059-.397-.165l-1.921-1.931c-.106-.105-.165-.248-.165-.397v-3.577c0-.31.253-.563.563-.563s.563.253.563.563v3.014l1.358-1.365c.105-.106.248-.165.397-.165s.292.059.397.165l1.358 1.365v-3.014c0-.31.253-.563.563-.563s.563.253.563.563v3.577zm4.773-1.427c.31 0 .563.253.563.563s-.253.563-.563.563h-1.074v.562c0 .31-.253.563-.563.563s-.563-.253-.563-.563v-1.125c0-.15.06-.293.165-.398s.248-.165.398-.165h1.637zm0-1.745c.31 0 .563.253.563.563s-.253.563-.563.563h-1.637c-.31 0-.563-.253-.563-.563v-1.125c0-.31.253-.563.563-.563s.563.253.563.563v.562h1.074z"/>
          </svg>
       )
    },
    {
       name: 'X (Twitter)で共有',
       href: shareLinks.x,
       icon: (
           <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-slate-800 dark:text-slate-200">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
           </svg>
       )
    },
    {
       name: 'Facebookで共有',
       href: shareLinks.facebook,
       icon: (
           <svg viewBox="0 0 24 24" fill="#1877F2" className="w-3.5 h-3.5 shrink-0">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
           </svg>
       )
    },
    {
       name: 'メールで送信',
       href: shareLinks.gmail,
       icon: <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
    }
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors text-xs font-medium shadow-2xs outline-none" 
          title="共有"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">共有</span>
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
        <Menu.Items className="absolute right-0 mt-1.5 w-48 origin-top-right rounded-lg bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 focus:outline-none z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="p-1">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">コピーしました</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>URLをコピー</span>
                </>
              )}
            </button>
          </div>

          <div className="p-1 space-y-0.5">
            {menuItems.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }) => (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className={`${
                      active ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                    } flex items-center gap-2 px-3 py-2 rounded transition-colors text-left`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
