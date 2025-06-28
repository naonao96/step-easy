#!/bin/bash

# StepEasy 環境別デプロイスクリプト
# 使用方法: ./scripts/deploy.sh [development|production]

set -e  # エラー時に停止

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 環境変数の確認
check_environment() {
    local env=$1
    
    log_info "環境変数の確認中: $env"
    
    if [ "$env" = "development" ]; then
        if [ ! -f ".env.development" ]; then
            log_error ".env.development ファイルが見つかりません"
            log_info "env.example をコピーして .env.development を作成してください"
            exit 1
        fi
    elif [ "$env" = "production" ]; then
        if [ ! -f ".env.production" ]; then
            log_error ".env.production ファイルが見つかりません"
            log_info "env.example をコピーして .env.production を作成してください"
            exit 1
        fi
    fi
    
    log_info "環境変数ファイルの確認完了"
}

# 依存関係のインストール
install_dependencies() {
    log_info "依存関係をインストール中..."
    npm install
    log_info "依存関係のインストール完了"
}

# ビルド
build_application() {
    local env=$1
    
    log_info "アプリケーションをビルド中: $env"
    
    # 環境変数ファイルを読み込み
    if [ "$env" = "development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    elif [ "$env" = "production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    # ビルド実行
    npm run build
    
    log_info "ビルド完了"
}

# Supabaseマイグレーション
deploy_supabase() {
    local env=$1
    
    log_info "Supabaseマイグレーションを実行中: $env"
    
    # 環境別のプロジェクト参照IDを取得
    if [ "$env" = "development" ]; then
        source .env.development
        PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
    elif [ "$env" = "production" ]; then
        source .env.production
        PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
    fi
    
    log_info "プロジェクト参照ID: $PROJECT_REF"
    
    # プロジェクトにリンク
    supabase link --project-ref $PROJECT_REF
    
    # マイグレーションをプッシュ
    supabase db push
    
    log_info "Supabaseマイグレーション完了"
}

# Edge Functionのデプロイ
deploy_edge_functions() {
    local env=$1
    
    log_info "Edge Functionをデプロイ中: $env"
    
    # 環境別のプロジェクト参照IDを取得
    if [ "$env" = "development" ]; then
        source .env.development
        PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
    elif [ "$env" = "production" ]; then
        source .env.production
        PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
    fi
    
    # Edge Functionをデプロイ
    supabase functions deploy generate-daily-messages --project-ref $PROJECT_REF
    
    log_info "Edge Functionデプロイ完了"
}

# Vercelデプロイ
deploy_vercel() {
    local env=$1
    
    log_info "Vercelにデプロイ中: $env"
    
    if [ "$env" = "development" ]; then
        # 開発環境はプレビューデプロイ
        vercel --target preview
    elif [ "$env" = "production" ]; then
        # 本番環境は本番デプロイ
        vercel --target production
    fi
    
    log_info "Vercelデプロイ完了"
}

# デプロイ後の確認
verify_deployment() {
    local env=$1
    
    log_info "デプロイの確認中: $env"
    
    # 環境別のURLを取得
    if [ "$env" = "development" ]; then
        source .env.development
        APP_URL=$NEXT_PUBLIC_APP_URL
    elif [ "$env" = "production" ]; then
        source .env.production
        APP_URL=$NEXT_PUBLIC_APP_URL
    fi
    
    log_info "アプリケーションURL: $APP_URL"
    log_info "デプロイ確認完了"
}

# メイン処理
main() {
    local env=${1:-development}
    
    log_info "StepEasy デプロイ開始: $env"
    
    # 引数の検証
    if [ "$env" != "development" ] && [ "$env" != "production" ]; then
        log_error "無効な環境です。development または production を指定してください"
        echo "使用方法: $0 [development|production]"
        exit 1
    fi
    
    # 本番環境の場合は確認
    if [ "$env" = "production" ]; then
        log_warn "本番環境へのデプロイを実行します"
        read -p "続行しますか？ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "デプロイをキャンセルしました"
            exit 0
        fi
    fi
    
    # 各ステップの実行
    check_environment $env
    install_dependencies
    build_application $env
    deploy_supabase $env
    deploy_edge_functions $env
    deploy_vercel $env
    verify_deployment $env
    
    log_info "デプロイ完了: $env"
}

# スクリプトの実行
main "$@" 