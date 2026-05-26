import { IComment } from './comment';
import { Movie } from './movie';

export interface AdminStats {
  users: number;
  comments: number;
  movies: number;
  activeUsers: number;
  latestUsers: {
    _id: string;
    username: string;
    avatar?: string;
    email: string;
    role: string;
    isBanned: boolean;
  }[];
  healthChart: { name: string; users: number }[];
  movieStorage: { genre: string; count: number }[];
  latestComments: IComment[];
}

export interface UserRequest {
  _id: string;
  username: string;
  avatar?: string;
  email: string;
}

export interface Banner {
  _id: string;
  title: string;
  image: string;
  movie?: Movie;
  link?: string;
}

export interface AdminGroup {
  _id: string;
  name: string;
  members: {
    _id: string;
    username: string;
    avatar?: string;
    email?: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

export interface AdminMessage {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  isEdited?: boolean;
  receiver?: {
    _id: string;
    username: string;
  };
  groupId?: string;
  createdAt: string;
}

export interface SupportConversation {
  user: {
    _id: string;
    username: string;
    avatar?: string;
    email?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
