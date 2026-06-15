export interface CryptoPanicPost {
  id: number;
  title: string;
  url: string;
  created_at: string;
  votes: {
    positive: number;
    negative: number;
    important: number;
  };
}

export interface CryptoPanicResponse {
  results: CryptoPanicPost[];
}
