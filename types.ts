export interface ApiResponse<T, E = string> {
  data: T;
  error?: E;
}
