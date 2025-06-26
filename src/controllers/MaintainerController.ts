// src/utils/github.ts
import { Octokit } from "@octokit/rest";
import { RequestHandler } from "express";
import User from "../model/User";
import GitHubOrganizationModel from "../model/Org";


// src/services/github.ts
export async function listOrgRepos(
  org: string,
  token: string
): Promise<any[]> {
  const response = await fetch(
    `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `GitHub API error fetching org repos: ${response.status} ${response.statusText} — ${text}`
    );
  }

  return (await response.json()) as any[];
}

export async function listUserRepos(
    username: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<any[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GITHUB_TOKEN not configured in environment");
    }
    if (!username) {
      throw new Error("GitHub username is required");
    }
  
    const octokit = new Octokit({
      auth: token,
      userAgent: "PullQuest-Backend v1.0.0",
    });
  
    try {
      const { data } = await octokit.request('GET /users/{username}/repos', {
        username,
        per_page: perPage,
        page,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }
      });
      return data;
    } catch (error: any) {
      console.error("GitHub API Error:", error);
  
      if (error.status === 401) {
        throw new Error("Invalid GitHub token in environment");
      }
      if (error.status === 403) {
        throw new Error("GitHub API rate limit exceeded or insufficient permissions");
      }
      if (error.status === 404) {
        throw new Error("User not found or repositories are private");
      }
      if (error.status === 422) {
        throw new Error("Invalid username");
      }
      if (error.status >= 500) {
        throw new Error("GitHub API server error. Please try again later");
      }
  
      throw new Error(`GitHub API error: ${error.message || "Unknown error"}`);
    }
  }

  export async function listRepoIssues(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    perPage: number = 30,
    page: number = 1
  ): Promise<any[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN not configured in environment");
    if (!owner || !repo) throw new Error("Owner and repo are required");
  
    const octokit = new Octokit({
      auth: token,
      userAgent: "PullQuest-Backend v1.0.0",
    });
  
    try {
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        state,
        per_page: perPage,
        page,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }
      });
      return data;
    } catch (error: any) {
      console.error("GitHub API Error:", error);
  
      if (error.status === 401) throw new Error("Invalid GitHub token in environment");
      if (error.status === 403) throw new Error("API rate limit exceeded or insufficient permissions");
      if (error.status === 404) throw new Error("Repository not found");
      if (error.status === 422) throw new Error("Invalid owner or repo");
      if (error.status >= 500) throw new Error("GitHub API server error. Try later");
  
      throw new Error(`GitHub API error: ${error.message || "Unknown error"}`);
    }
  }

  export async function listRepoPullRequests(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    perPage: number = 30,
    page: number = 1,
    sort: "created" | "updated" | "popularity" | "long-running" = "created",
    direction: "asc" | "desc" = "desc"
  ): Promise<any[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN not configured in environment");
    if (!owner || !repo) throw new Error("Owner and repo are required");
  
    const octokit = new Octokit({
      auth: token,
      userAgent: "PullQuest-Backend v1.0.0",
    });
  
    try {
      const { data } = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
        owner,
        repo,
        state,
        per_page: perPage,
        page,
        sort,
        direction,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
  
      return data;
    } catch (error: any) {
      console.error("GitHub PR API Error:", error);
  
      if (error.status === 401) throw new Error("Invalid GitHub token in environment");
      if (error.status === 403) throw new Error("API rate limit exceeded or insufficient permissions");
      if (error.status === 404) throw new Error("Repository not found");
      if (error.status === 422) throw new Error("Invalid owner or repo");
      if (error.status >= 500) throw new Error("GitHub API server error. Try later");
  
      throw new Error(`GitHub PR API error: ${error.message || "Unknown error"}`);
    }
  }

  export async function createRepoIssueAsUser(
    githubToken: string,
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[],
    milestone?: number | string
  ): Promise<any> {
    if (!githubToken) {
      throw new Error("User GitHub token is required");
    }
    if (!owner || !repo) {
      throw new Error("Owner and repo are required");
    }
    if (!title) {
      throw new Error("Issue title is required");
    }
  
    const octokit = new Octokit({ auth: githubToken });
  
    try {
      const response = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
        // Octokit expects milestone as a number:
        milestone: milestone
          ? typeof milestone === "string"
            ? parseInt(milestone, 10)
            : milestone
          : undefined,
      });
  
      return response.data; // full Issue object
    } catch (error: any) {
      console.error("GitHub API Error (create issue):", error);
  
      // normalize common error cases
      if (error.status === 403) {
        throw new Error("Insufficient permissions or rate limit");
      }
      if (error.status === 404) {
        throw new Error("Repo not found or issues disabled");
      }
      if (error.status === 410) {
        throw new Error("Issues are disabled for this repository");
      }
      if (error.status === 422) {
        throw new Error("Validation failed (labels / assignees / milestone?)");
      }
  
      throw new Error(error.message || "Unknown GitHub error");
    }
  }

  export const getIssueByNumber: RequestHandler = async (req, res) => {
    try {
      const { owner, repo, number } = req.query as {
        owner?: string;
        repo?: string;
        number?: string;
      };
  
      console.log("➡️ Incoming request to getIssueByNumber:");
      console.log("Query Parameters:", { owner, repo, number });
  
      if (!owner || !repo || !number) {
        res.status(400).json({
          success: false,
          message: "Missing required query parameters: owner, repo, or number",
        });
        return;
      }
  
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        res.status(500).json({
          success: false,
          message: "GITHUB_TOKEN not configured in environment",
        });
        return;
      }
  
      const octokit = new Octokit({
        auth: token,
        userAgent: "PullQuest-Backend v1.0.0",
      });
  
      console.log("📡 Sending request to GitHub API for issue:", {
        owner,
        repo,
        issue_number: Number(number),
      });
  
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/issues/{issue_number}",
        {
          owner,
          repo,
          issue_number: Number(number),
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
  
      console.log("✅ GitHub API responded with issue data:", data);
  
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("❌ GitHub API Error (getIssueByNumber):", error);
  
      const statusCode =
        error.status === 401
          ? 401
          : error.status === 403
          ? 403
          : error.status === 404
          ? 404
          : 500;
  
      res.status(statusCode).json({
        success: false,
        message: error?.message || "Unable to fetch issue",
      });
    }
  };

  export async function mergePullRequestAsUser(
    githubToken: string,
    owner: string,
    repo: string,
    pull_number: number,
    commit_title?: string,
    commit_message?: string,
    sha?: string,
    merge_method: "merge" | "squash" | "rebase" = "squash"
  ): Promise<any> {
    if (!githubToken) throw new Error("User GitHub token is required")
    if (!owner || !repo) throw new Error("Owner and repo are required")
    if (!pull_number) throw new Error("Pull request number is required")
  
    const octokit = new Octokit({
      auth: githubToken,
      userAgent: "PullQuest-MergePR/1.0.0",
    })
  
    try {
      const response = await octokit.request("PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge", {
        owner,
        repo,
        pull_number,
        commit_title,
        commit_message,
        sha,
        merge_method,
        headers: {
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
  
      return response.data // contains { merged, message, sha }
    } catch (error: any) {
      console.error("GitHub API Error (merge PR):", error)
  
      if (error.status === 403) {
        throw new Error("Forbidden: Check token scopes or rate limiting")
      }
      if (error.status === 404) {
        throw new Error("Pull request not found")
      }
      if (error.status === 405) {
        throw new Error("Merge cannot be performed")
      }
      if (error.status === 409) {
        throw new Error("Conflict: PR head SHA mismatch")
      }
      if (error.status === 422) {
        throw new Error("Validation failed or endpoint spammed")
      }
  
      throw new Error(error.message || "Unknown GitHub error")
    }
  }
  
  export async function updateUserStatsAsUser(
    githubUsername: string,
    addedXp: number,
    addedCoins: number
  ): Promise<{
    githubUsername: string;
    newXp: number;
    newCoins: number;
  }> {
    if (!githubUsername) {
      throw new Error("githubUsername is required");
    }
  
    const updated = await User.findOneAndUpdate(
      { githubUsername },
      {
        $inc: {
          xp: addedXp,
          coins: addedCoins,
        },
        updatedAt: new Date(),
      },
      { new: true }
    )
      .select("githubUsername xp coins")
      .lean(); // optional: returns a plain object instead of a Mongoose Document
  
    if (!updated) {
      throw new Error(`No user found for githubUsername="${githubUsername}"`);
    }
  
    return {
      // use `!` to assert these fields are present
      githubUsername: updated.githubUsername!,
      newXp: updated.xp!,
      newCoins: updated.coins!,
    };
  }

  export const getOrgApiKeys: RequestHandler = async (req, res) => {
    try {
      /* 0️⃣ Debug ---------------------------------------------------------- */
      console.log("📥 /api-keys query:", req.query);
      console.log("🔒 req.user (verifyToken):", req.user);
  
      /* 1️⃣ Validate `orgName` -------------------------------------------- */
      const { orgName, maintainerUsername: qMaintainer } = req.query as {
        orgName?: string;
        maintainerUsername?: string;
      };
  
      if (!orgName) {
        res.status(400).json({
          success: false,
          message: "`orgName` query param required",
        });
        return;
      }
  
      /* 2️⃣ Resolve maintainer username ----------------------------------- */
      const maintainerUsername =
        qMaintainer || (req.user as any)?.githubUsername;
  
      if (!maintainerUsername) {
        res.status(401).json({
          success: false,
          message:
            "Maintainer GitHub username missing (provide query param or login)",
        });
        return;
      }
  
      console.log("✅ Maintainer GitHub username:", maintainerUsername);
  
      /* 3️⃣ Look up the org document -------------------------------------- */
      const orgDoc = await GitHubOrganizationModel.findOne({
        githubUsername: maintainerUsername,   // <- maintainer
        "organization.login": orgName,        // <- org
      }).select("apiKeys organization.login");
  
      console.log("🔍 DB lookup:", orgDoc ? "FOUND" : "NOT FOUND");
  
      if (!orgDoc) {
        res.status(404).json({
          success: false,
          message: `No organization "${orgName}" found for maintainer "${maintainerUsername}"`,
        });
        return;
      }
  
      /* 4️⃣ Filter the API keys for this maintainer ----------------------- */
      const filteredKeys = (orgDoc.apiKeys || []).filter(
        (k) => k.githubUsername === maintainerUsername
      );
  
      console.log(
        `🔑 ${filteredKeys.length}/${orgDoc.apiKeys.length} key(s) match maintainer`
      );
  
      res.status(200).json({ success: true, data: filteredKeys });
    } catch (err: any) {
      console.error("❌ Error fetching API keys:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  };