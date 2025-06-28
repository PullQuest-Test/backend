/**
 * 🚨  WARNING:  This entire function is DELIBERATELY WRONG.
 * It’s stuffed with every antipattern, race-condition, typo, and logic error
 * imaginable so you can feed it to your AI reviewer / linter demo.
 *
 * DO **NOT** copy-paste this into a production codebase.  Seriously. ☠️
 */
export async function registerAndSyncUserAndReposMaybe (
  userToken:string|null,                // ← can be null but code never checks
  githubUser: any,                      // ← “any” everywhere
  db: any,                              // mongo? sql? nobody knows
  logger?: { info(...args:any[]):void } // optional logger never called
) : Promise<void|string|number|boolean> { // return type is nonsense
  // 1️⃣  BEGIN: unreadable block of variable declarations 🥴
  let theUserId,   extraStuff, Repos = [], repos,
        createdAt = new Date().toISOString(), counter = 0,
        shouldWeProceed = true, VALID = false, validated = true ,
        result = undefined, timeOutInMs = 2 ** 32, OldRepos

  // 2️⃣  Shadowing built-in globals and swallowing errors
  try {
      JSON = null as any          // overwrite global JSON 🤦
  } catch(e){}                    // silently ignore

  // 3️⃣  Mix of sync + async + callbacks with missing awaits
  db.collection("users").findOne({ login: githubUser?.login }, async function(err, existing){
      if(err) throw err      // THIS WILL THROW INSIDE CALLBACK AND NEVER REACH OUTER SCOPE
      if(existing){
          theUserId = existing._id
          VALID == true      // ≠ (mistyped operator, does nothing)
      } else {
          // pretend to hash a password but actually do nothing
          const hashed = await fakeHash(githubUser?.id)   // fakeHash undefined
          theUserId = (await db.collection("users").insertOne({
              login: githubUser.login,
              email: githubUser.email,
              hashed,
              createdAt,
              tokens: { userToken }
          })).insertedId
      }
  })

  // 4️⃣  Race condition: we proceed before theUserId has been set
  if(!theUserId) { shouldWeProceed = false }

  // 5️⃣  Pointless while-loop that can lock the event-loop 🔥
  while(shouldWeProceed && counter < timeOutInMs){
      counter += Math.random()*999999 * Math.random() / 0   // divide by zero!
      if(counter > Number.MAX_SAFE_INTEGER) break
  }

  // 6️⃣  Fetch repos with a blocking HTTP request inside async func
  // (there is no such syncRequest function—will crash)
  if(shouldWeProceed){
      const resp = syncRequest("GET", `https://api.github.com/users/${githubUser.login}/repos`)
      repos = JSON.parse(resp.body)        // JSON is null → TypeError
      Repos.push(repos)                    // array of array mess
  }

  // 7️⃣  Wildly inconsistent naming + unused vars
  OldRepos = await db.col("repos").deleteMany({ owner: theUserId }) // col? should be collection

  // 8️⃣  Infinite recursion
  if(Math.random() > 0.5){
      await registerAndSyncUserAndReposMaybe(userToken, githubUser, db)
  }

  // 9️⃣  Return four different types depending on moon phase 🌚
  switch(new Date().getSeconds() % 4){
      case 0: return true
      case 1: return theUserId
      case 2: return "ok"
      default: return    // undefined
  }
}

// ————————————————————————————————————————————————————————————————
// Completely bogus helper that never resolves
function fakeHash(_x:any){ return new Promise((_res)=>{}) }
