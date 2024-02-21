//
// This is a proxy to the official PlayFab SDK, converting calls to 'async', which maps to C3 better.
//
// 2021-04-11: updated to support Modules
import {PlayFab, PlayFabClientSDK} from "./PlayFabClientApi.js";


runOnStartup(async runtime =>
{
	// This code runs on startup with the 'runtime' variable available
	globalThis.g_runtime = runtime;
});

// The Results are stored by SDK call name, with the exception on Login - there are, to date, 19 different logins, of which only one can be active,
// so these will share the common name "LoginWithXXX". Anything else would just be overkill.
export let gPlayFabCachedData = {
		Keys:[],
		PlayFabID: null,	// Can come from various calls, so cache it separately.
		Results: []
		};

// Constants
export let gPFConst = {
	kAddUsernamePassword:	"AddUsernamePassword",
	kGetAccountInfo:		"GetAccountInfo",
	kGetLeaderboard:		"GetLeaderboard",
	kGetUserData:			"GetUserData",
	kLoginWithXXX:			"LoginWithXXX",
	kRegisterPlayFabUser:	"RegisterPlayFabUser",
	kUpdatePlayerStatistics:"UpdatePlayerStatistics",
	kUpdateUserData:		"UpdateUserData"
};
Object.freeze(gPFConst);

// Get the stored PlayFabID, from the Login command.
export function PlayFab_GetPlayFabID()
{
	if(gPlayFabCachedData)
	{
		if(gPlayFabCachedData.PlayFabID)
		{
			return gPlayFabCachedData.PlayFabID;
		}
	}
	return "";
}

export function PlayFab_ResetPlayFabID()
{
	gPlayFabCachedData.PlayFabID = null;
}

// Get the DisplayName, if there is one.
export function PlayFab_GetDisplayName()
{
	if(gPlayFabCachedData)
	{
		if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result)
		{
			if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data)
			{
				if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data.InfoResultPayload)
				{
					if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data.InfoResultPayload.PlayerProfile)
					{
						if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data.InfoResultPayload.PlayerProfile)
						{
							if(gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data.InfoResultPayload.PlayerProfile.DisplayName)
							{
								return gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result.data.InfoResultPayload.PlayerProfile.DisplayName;
							}
						}
					}
				}
			}
		}
	}
	return "";
}

// Get the last user-data, by key.
export function PlayFab_UserData(key)
{
	if(gPlayFabCachedData.Keys[key])
	{
		return gPlayFabCachedData.Keys[key];
	}
	else
	{
		return "";
	}
}

// Return the last error, by command name.
//
export function PlayFab_Error(key)
{
	if(gPlayFabCachedData.Results[key])
	{
		if(gPlayFabCachedData.Results[key].Error)
		{
			return CompileErrorReport(gPlayFabCachedData.Results[key].Error);
		}
	}
	
	return "";
}

// Get a leaderboard item, by index, and key, where the key is 'name' or, anything else will return the value.
//
export function PlayFab_GetLeaderboardItem(index, type)
{
	if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard])
	{
		if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Error == null)
		{
			if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result)
			{
				if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data)
				{
					if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard)
					{
						if(type == "name")
						{
							if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard[index])
							{
								if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard[index].DisplayName)
								{
									return gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard[index].DisplayName;
								}
								else
								{
									return gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard[index].PlayFabId;
								}
							}
						}
						else
						{
							return gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard[index].StatValue;
						}
					}
				}
			}
		}
	}
	
	return null;
}

// Get the number of items in the leaderboard.
//
export function PlayFab_GetLeaderboardCount()
{
	if(gPlayFabCachedData.Results)
	{
		if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard])
		{
			if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result)
			{
				if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data)
				{
					if(gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard)
					{
						return gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result.data.Leaderboard.length;
					}
				}
			}
		}
	}
	return 0;
}

export function PlayFab_GetAccountInfoUserName()
{
	if(gPlayFabCachedData.Results)
	{
		if(gPlayFabCachedData.Results[gPFConst.kGetAccountInfo])
		{
			if(gPlayFabCachedData.Results[gPFConst.kGetAccountInfo].Result)
			{
				return "tbd.......";
			}
		}
	}
	return "";
}


// Async versions

// Login with the CustomID mechanism.
//
export async function PlayFab_LoginWithCustomID(titleID, customID, createAccount)
{
console.log("PlayFab_LoginWithCustomID-IN");
	// Required for subsequent calls!
	PlayFab.settings.titleId = titleID;
	
    let pfRequest = {
		TitleId: titleID,
        CustomId: customID,
        CreateAccount: createAccount,
		InfoRequestParameters: {GetPlayerProfile: true}
    };
	
	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.LoginWithCustomID(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	// Reset the cache
	gPlayFabCachedData.Results[gPFConst.kLoginWithXXX] = { Result: null, Error: null};
	gPlayFabCachedData.PlayFabID = null;

	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result = result;
			gPlayFabCachedData.PlayFabID = result.data.PlayFabId;
			console.log("PlayFab_LoginWithCustomID-OUT");
		}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Error = error;
			console.log("Error:"+CompileErrorReport(error));
			console.log("PlayFab_LoginWithCustomID-OUT");
		}
	);
}

export async function PlayFab_RegisterUser(titleID, displayname, email, password, username)
{
console.log("PlayFab_RegisterUser-IN");
	// Required for subsequent calls!
	PlayFab.settings.titleId = titleID;
	
    let pfRequest = {
		TitleId: titleID,
		DisplayName: displayname,
        Email: email,
        Password: password,
		Username: username,
		RequireBothUsernameAndEmail: true,
		InfoRequestParameters: {GetPlayerProfile: true}
    };
	
	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.RegisterPlayFabUser(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};
	
	// Reset the cache
	gPlayFabCachedData.Results[gPFConst.kRegisterPlayFabUser] = { Result: null, Error: null};
	// Register over-rides Login, so wipe out any cached Login data.
	gPlayFabCachedData.Results[gPFConst.kLoginWithXXX] = { Result: null, Error: null};
	gPlayFabCachedData.PlayFabID = null;
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kRegisterPlayFabUser].Result = result;
			gPlayFabCachedData.PlayFabID = result.data.PlayFabId;
			console.log("PlayFab_RegisterUser-OUT");
		}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kRegisterPlayFabUser].Error = error;
			console.log("Error:"+CompileErrorReport(error));
			console.log("PlayFab_RegisterUser-OUT");
		}
	);
}

export async function PlayFab_LoginWithEmail(titleID, email, password)
{
console.log("PlayFab_LoginWithEmail-IN");
	// Required for subsequent calls!
	PlayFab.settings.titleId = titleID;
	
    let pfRequest = {
		TitleId: titleID,
        Email: email,
        Password: password,
		InfoRequestParameters: {GetPlayerProfile: true}
    };
	
	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.LoginWithEmailAddress(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kLoginWithXXX] = { Result: null, Error: null};
	gPlayFabCachedData.PlayFabID = null;
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result = result;
			gPlayFabCachedData.PlayFabID = result.data.PlayFabId;
			console.log("PlayFab_LoginWithEmail-OUT-pass");
		}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Error = error;
			console.log("Error:"+CompileErrorReport(error));
			console.log("PlayFab_LoginWithEmail-OUT-fail");
		}
	);
}

export async function PlayFab_LoginWithPlayFab(titleID, username, password)
{
console.log("PlayFab_LoginWithPlayFab-IN");
	// Required for subsequent calls!
	PlayFab.settings.titleId = titleID;
	
    let pfRequest = {
		TitleId: titleID,
        Username: username,
        Password: password,
		InfoRequestParameters: {GetPlayerProfile: true}
    };
	
	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.LoginWithPlayFab(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kLoginWithXXX] = { Result: null, Error: null};
	gPlayFabCachedData.PlayFabID = null;
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Result = result;
			gPlayFabCachedData.PlayFabID = result.data.PlayFabId;
			console.log("PlayFab_LoginWithPlayFab-OUT-pass");
		}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kLoginWithXXX].Error = error;
			console.log("Error:"+CompileErrorReport(error));
			console.log("PlayFab_LoginWithPlayFab-OUT-fail");
		}
	);
}

export async function PlayFab_GetUserData(key)
{
	let pfRequest = {
		Keys: [key],
		PlayFabID: gPlayFabCachedData.PlayFabID
		};

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.GetUserData(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kGetUserData] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kGetUserData].Result = result;
			gPlayFabCachedData.Keys[key] = null;
			if(result.data)
			{
				if(result.data.Data)
				{
					if(result.data.Data[key])
					{
						gPlayFabCachedData.Keys[key] = result.data.Data[key].Value;	// Keys can/are retrieved one at a time, so we have to store them separately.
					}
				}
			}
		}
	).catch(
		error => {
		gPlayFabCachedData.Results[gPFConst.kGetUserData].Error = error;
		gPlayFabCachedData.Keys[key] = "";	// Clear the key.
		console.log("Error:"+CompileErrorReport(error));
		}
	);
}

export async function PlayFab_UpdateUserData(key, value)
{
	let pfRequest = {
		Data: {}
		};
		
	pfRequest.Data[key] = value;

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.UpdateUserData(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kUpdateUserData] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kUpdateUserData].Result = result;
		}
	).catch(
		error => {
		gPlayFabCachedData.Results[gPFConst.kUpdateUserData].Error = error;
		console.log("Error:"+CompileErrorReport(error));
		}
	);
}

export async function PlayFab_UpdatePlayerStatistics(key, value)
{
	let pfRequest = {
		Statistics: [{StatisticName:key, Value:value}]
		};

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.UpdatePlayerStatistics(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kUpdatePlayerStatistics] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
		gPlayFabCachedData.Results[gPFConst.kUpdatePlayerStatistics].Result = result;
		}
	).catch(
		error => {
		gPlayFabCachedData.Results[gPFConst.kUpdatePlayerStatistics].Error = error;
		console.log("Error:"+CompileErrorReport(error));
		}
	);
}

export async function PlayFab_GetLeaderboard(maxResultsCount, statisticName)
{
	let pfRequest = {
		MaxResultsCount: maxResultsCount,
		StartPosition: 0,
		StatisticName: statisticName,
		ProfileConstraints: { ShowDisplayName: true }//, ShowLinkedAccounts: true }
		};

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.GetLeaderboard(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kGetLeaderboard] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Result = result;
			}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kGetLeaderboard].Error = error;
			console.log("Error:"+CompileErrorReport(error));
		}
	);
}



export async function PlayFab_AddUsernamePassword(email, password, username)
{
	let pfRequest = {
		Email: email,
		Password: password,
		Username: username
		};

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.AddUsernamePassword(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kAddUsernamePassword] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kAddUsernamePassword].Result = result;
			}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kAddUsernamePassword].Error = error;
			console.log("Error:"+CompileErrorReport(error));
		}
	);
}

// Only passing in PlayFabID for use with Leaderboard display.
export async function PlayFab_GetAccountInfo(playfabid)
{
	let pfRequest = {
		PlayFabId: playfabid
		};

	const playfabPromise = (pfRequest) => 
	{
  		return new Promise((resolve, reject) => 
		{
  			PlayFabClientSDK.GetAccountInfo(pfRequest, (result, error) => 
			{
				if(error) return reject(error);
				resolve(result);
			});
  		})
	};	
	
	gPlayFabCachedData.Results[gPFConst.kGetAccountInfo] = { Result: null, Error: null};
	
	return playfabPromise(pfRequest).then(
		result => {
			gPlayFabCachedData.Results[gPFConst.kGetAccountInfo].Result = result;
			}
	).catch(
		error => {
			gPlayFabCachedData.Results[gPFConst.kGetAccountInfo].Error = error;
			console.log("Error:"+CompileErrorReport(error));
		}
	);
}

export function PlayFab_LogSDKDetails()
{
	console.log("Current version is: " + PlayFab._internalSettings.requestGetParams.sdk);
	
	// Update this hard coded version if you are resyncing the interface.
	console.log("Interface confirmed against: 1.67.200615");
}


// This is a utility function we haven't put into the core SDK yet.
export function CompileErrorReport(error)
{
    if (error === null)
        return "";
	if(error.errorMessage)
	{
		var fullErrors = error.errorMessage;
		for (var paramName in error.errorDetails)
			for (var msgIdx in error.errorDetails[paramName])
				fullErrors += "\n" + paramName + ": " + error.errorDetails[paramName][msgIdx];
	}
	else
	{
		fullErrors = error;
	}
    return fullErrors;
}