// 既存の型定義に追加
export interface InteractiveMessage {
  id: string;
  text: string;
  options?: MessageOption[];
  timestamp: string;
  userType: 'free' | 'premium';
}

export interface MessageOption {
  id: string;
  text: string;
  action: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export interface UserResponse {
  messageId: string;
  optionId: string;
  timestamp: string;
} 