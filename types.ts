export enum Platform {
  LINKEDIN = "linkedin",
  X = "x",
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  REDDIT = "reddit"
}

export interface CommentInput {
  platform: Platform;
  post_text: string;
  author_handle?: string;
  max_length_chars?: number;
  avoid_keywords?: string[];
  privacy_consent: boolean;
}

export interface GeneratedComment {
  id: number;
  text: string;
  length_chars: number;
  rationale: string;
}

export interface ToneOption {
  value: string;
  label: string;
}

export interface CommentTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface SuggestedCommentType {
  value: string;
  label: string;
  why: string;
}

export interface CommentResponse {
  status: "ok" | "rejected";
  rejection_reason?: string;
  recommendation?: {
    comment_id: number;
  };
  comments?: GeneratedComment[];
  tone_options?: ToneOption[];
  comment_type_options?: CommentTypeOption[];
  additional_suggested_comment_types?: SuggestedCommentType[];
}