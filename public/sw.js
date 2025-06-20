const CACHE_NAME = 'stepeasy-v1.0.0';
const RUNTIME_CACHE = 'stepeasy-runtime';

// キャッシュすべきリソース
const PRECACHE_RESOURCES = [
  '/',
  '/menu',
  '/tasks',
  '/progress',
  '/settings',
  '/logo.png',
  '/manifest.json'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching initial resources');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => {
        // 即座にアクティブ化
        return self.skipWaiting();
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // すべてのクライアントを制御
      self.clients.claim()
    ])
  );
});

// フェッチイベントの処理（キャッシュ戦略）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // APIリクエストは常にネットワーク優先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // レスポンスのクローンをキャッシュ
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request);
        })
    );
    return;
  }

  // 静的リソースはキャッシュ優先
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // キャッシュにない場合はネットワークから取得
        return fetch(request)
          .then((response) => {
            // 正常なレスポンスの場合のみキャッシュ
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // オフライン時のフォールバック
            if (request.destination === 'document') {
              return caches.match('/');
            }
            return new Response('オフラインです', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'StepEasy',
      body: 'タスクのリマインダーです',
      icon: '/logo.png'
    };
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: '確認する',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // 何もしない（通知を閉じるのみ）
    return;
  } else {
    // デフォルトアクション（通知本体クリック）
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// バックグラウンド同期の処理
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'task-sync') {
    event.waitUntil(
      // タスクデータの同期処理
      syncTasks()
    );
  }
});

// タスク同期の実装
async function syncTasks() {
  try {
    // IndexedDBからオフライン中に作成/更新されたタスクを取得
    // サーバーと同期処理
    console.log('Syncing tasks with server...');
    
    // 実装予定：
    // 1. オフライン中に変更されたデータの収集
    // 2. サーバーへの送信
    // 3. 競合解決
    
  } catch (error) {
    console.error('Task sync failed:', error);
  }
} 