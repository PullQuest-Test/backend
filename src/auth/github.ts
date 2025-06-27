import passport from "passport";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";
import { VerifyCallback } from "passport-oauth2";
import dotenv from "dotenv";

dotenv.config();


passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "http://localhost:8012/auth/github/callback",
      scope: [


        "write:repo_hook", 
        "admin:repo_hook", 
      ]
    },
    
    function (
      accessToken: string,
      refreshToken: string,
  
      done: VerifyCallback
    ) {
      const user = {
        profile,
        accessToken,
        refreshToken,
      };
      return done(null, user);
    }    
  )
);
