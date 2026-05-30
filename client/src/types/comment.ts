export interface IReply {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  replyToUser?: string;
  likes: string[];
  createdAt: string;
}

export interface IComment {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
    email?: string;
  };
  movieId: string;
  movieTitle?: string;
  content: string;
  rating: number;
  likes: string[];
  likesCount?: number;
  reportsCount: number;
  reports?: { user: string; reason: string }[];
  replies: IReply[];
  repliesCount?: number;
  createdAt: string;
}
