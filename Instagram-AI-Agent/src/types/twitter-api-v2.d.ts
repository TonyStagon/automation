declare module 'twitter-api-v2' {
  interface TwitterApiTokens {
    appKey?: string;
    appSecret?: string;
    consumerKey?: string;
    consumerSecret?: string;
    accessToken: string;
    accessTokenSecret: string;
    bearerToken?: string;
  }

  class TwitterApi {
    constructor(tokens: TwitterApiTokens | string);
    v1: any;
    v2: any;
    readOnly: TwitterApi;
    readWrite: TwitterApi;
  }

  export default TwitterApi;
}