<!-- 装飾用の雲 -->
<div class="cloud" style="width: 80px; height: 80px; top: 15%; left: 15%;"></div>
<div class="cloud" style="width: 120px; height: 120px; bottom: 20%; right: 10%;"></div>

<div class="container mx-auto px-4">
  <div class="login-card w-full max-w-md mx-auto">
    <!-- ヘッダー部分 -->
    <div class="bg-gradient-to-r from-sky-200 to-blue-200 p-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-blue-600">StepEasy</h1>
        <p class="text-blue-500 text-xs">タスクを完了へ導く、心理的サポート付き目標管理アプリ</p>
      </div>
      <div class="floating">
        <!-- セキセイインコのSVGイラスト -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" class="h-16 w-16">
          <!-- 体 -->
          <ellipse cx="100" cy="90" rx="40" ry="45" fill="#c2f0c2" />
          <!-- 頭 -->
          <circle cx="100" cy="50" r="30" fill="#c2f0c2" />
          <!-- くちばし -->
          <path d="M100 60 L110 70 L100 75 L90 70 Z" fill="#ffcc66" />
          <!-- 目 -->
          <circle cx="90" cy="45" r="5" fill="black" />
          <circle cx="110" cy="45" r="5" fill="black" />
          <circle cx="88" cy="43" r="2" fill="white" />
          <circle cx="108" cy="43" r="2" fill="white" />
          <!-- 羽 (左) -->
          <g class="budgie-wing">
            <path d="M70 80 Q60 100 70 120 L80 110 Q75 95 80 80 Z" fill="#a7e9af" />
          </g>
          <!-- 羽 (右) -->
          <g class="budgie-wing" style="transform: scaleX(-1); transform-origin: center;">
            <path d="M70 80 Q60 100 70 120 L80 110 Q75 95 80 80 Z" fill="#a7e9af" />
          </g>
          <!-- 頭の模様 -->
          <path d="M85 30 Q100 20 115 30 Q100 40 85 30 Z" fill="#a7e9af" />
          <!-- 足 -->
          <path d="M90 135 L85 145 L95 145 Z" fill="#ffcc66" />
          <path d="M110 135 L105 145 L115 145 Z" fill="#ffcc66" />
        </svg>
      </div>
    </div>
    
    <!-- フォーム部分 -->
    <div class="p-5">
      <form id="loginForm" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input id="email" type="text" class="input-field pl-9 w-full py-2 px-3 rounded-lg text-gray-800 focus:outline-none text-sm" placeholder="example@mail.com" required>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between items-center mb-1">
            <label for="password" class="block text-sm font-medium text-gray-700">パスワード</label>
            <a href="#" class="text-xs text-sky-500 hover:text-sky-700 font-medium">パスワードを忘れた</a>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input id="password" type="password" class="input-field pl-9 w-full py-2 px-3 rounded-lg text-gray-800 focus:outline-none text-sm" placeholder="••••••••" required>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" id="togglePassword" class="text-sky-400 hover:text-sky-600 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex items-center">
          <input id="remember" type="checkbox" class="h-3 w-3 text-sky-500 focus:ring-sky-400 border-gray-300 rounded">
          <label for="remember" class="ml-2 block text-xs text-gray-700">ログイン情報を保存する</label>
        </div>
        
        <button type="submit" class="login-btn w-full py-2 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 text-sm">
          ログインして一歩踏み出す
        </button>
      </form>
      
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-600">
          アカウントをお持ちでないですか？ <a href="#" class="font-medium text-sky-500 hover:text-sky-700">新規登録</a>
        </p>
      </div>
      
      <div class="mt-4">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-2 bg-white text-gray-500">または</span>
          </div>
        </div>
        
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button type="button" class="flex justify-center items-center py-1.5 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            <svg class="h-4 w-4 mr-1" fill="#4285F4" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Google
          </button>
          <button type="button" class="flex justify-center items-center py-1.5 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            <svg class="h-4 w-4 mr-1" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
            </svg>
            Facebook
          </button>
        </div>
      </div>
    </div>
    
    <!-- フッター -->
    <div class="text-center py-2 bg-gray-50 text-xs text-gray-500">
      <p>© 2023 StepEasy</p>
    </div>
  </div>
</div>