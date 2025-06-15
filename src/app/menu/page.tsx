'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MenuLayout } from '@/components/templates/MenuLayout';
import { MenuItem } from '@/components/molecules/MenuItem';
import { FaTasks, FaChartLine, FaRobot, FaCog } from 'react-icons/fa';

export default function MenuPage() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'タスク管理',
      description: 'タスクの作成、編集、完了管理を行います。',
      icon: FaTasks,
      path: '/tasks',
    },
    {
      title: '進捗管理',
      description: 'タスクの進捗状況や達成率を確認できます。',
      icon: FaChartLine,
      path: '/progress',
    },
    {
      title: 'AIサポート',
      description: 'AIによるタスク管理のサポートを受けられます。',
      icon: FaRobot,
      path: '/ai-support',
    },
    {
      title: '設定',
      description: 'アプリケーションの設定を変更できます。',
      icon: FaCog,
      path: '/settings',
    },
  ];

  return (
    <MenuLayout>
      {menuItems.map((item, index) => (
        <MenuItem
          key={index}
          title={item.title}
          description={item.description}
          icon={item.icon}
          onClick={() => router.push(item.path)}
        />
      ))}
    </MenuLayout>
  );
}