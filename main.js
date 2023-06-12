import './style.css';
import javascriptLogo from './javascript.svg';
import { setupCounter } from './counter.js';
import OBR from "@owlbear-rodeo/sdk";

var dictResources= {
  //Player1: { noname_var: (data = { quantity: 5, consumed: 2 }) },
};

var playerName = 'Loading';
var finalHTML = '';
var selectedPlayer = '';

var isGM = false;

//await OBR.party.getPlayers().then((party) =>

init();

async function init()
{
	await OBR.onReady(() => { start();});
}

async function start ()
{
	reloadResources();
	drawMainStructure();
	
	document.querySelector('#resourcePanel').innerHTML = "loading";
	
	await OBR.player.getRole().then((role) => {
		isGM = (role == "GM");
		console.log("GM? " + isGM );
	});
	
	await OBR.player.getName().then((name) => {
		
		console.log ("playerNameLoaded: " + name);
		playerName = name;
		redrawResources();
		updateMetadata();
	});
	
	
	OBR.party.onChange(async(party) =>
	{
		playerUpdate();
		console.log("Party cambiada " + party);
		if (selectedPlayer == '')
		{
			
			selectSelfPlayer(playerName);
		}
		else
		{
			searchForPlayerResources(selectedPlayer);
		}
	});	

	OBR.player.onChange(async(player) =>
	{
		console.log("Player changed " + player.name);
		
		if (playerName != player.name)
		{
			playerName = player.name;
			updateMetadata();
		}
		else
		{
			playerUpdate();
		//updateMetadata();
			if (selectedPlayer == '')
			{
				redrawResources();
			}
			else
			{
				searchForPlayerResources(selectedPlayer);
			}
		}
		
	});	
	
}




function reloadResources() {

  var readLocalStorage = JSON.parse(window.localStorage.getItem("com.simplesr.metadata_resources"));
	console.log ("RELOADING RESOURCES " + window.localStorage.getItem("com.simplesr.metadata_resources"));
	
	if (readLocalStorage != null)
	{
		dictResources = readLocalStorage;
		console.log ("STORED");
	}
	
	var validation = ``;
	
	Object.keys(dictResources).forEach((charactername) => {
		
		Object.keys(dictResources[charactername]).forEach((resource) => {
			console.log("LOADED ELEMENT " + resource);
			validation = validateIdentifier(resource);
			if (validation != resource)
			{
				dictResources[charactername][validation] = dictResources[charactername][resource];
				delete dictResources[charactername][resource];
			}
		});
	});
	
	updateMetadata();
}

function addResourceToDictionary (name, quantity)
{
	name = validateIdentifier(name);
	if (dictResources[playerName] == null)
	{
		dictResources[playerName] = {};
	}
	if (dictResources[playerName][name] == null)
	{
		dictResources[playerName][name] = {};
		dictResources[playerName][name].consumed = 0;
	}
	dictResources[playerName][name].quantity = quantity;
	
	
	OBR.notification.show ('Player "' + playerName + '" added the resource: ' + name + ' x' + quantity);
	
	updateMetadata();
}




function drawMainStructure()
{
	finalHTML ="<div><p id=selectedPlayerResources></p></div>";
	//finalHTML = "<div><p><img src='apple.svg'><img src='appleoff.svg'></p></div>";
	//finalHTML += "<div><p></p><progress value=20 max=100></progress></p></div>"
	finalHTML += "<div><p id=playerbuttons>Loading Players</p></div>";
	finalHTML += "<div><p id=resourcePanel>Loading resources</p></div>";
	finalHTML += "<div alignment='left'><p id=addResourcePanel><input type ='text' required pattern='[0-9a-zA-Z_]*' id='resourceNameTextField' value = 'HP'>Resource Name</input><input type='number' id=resourceQuantityNumberField value = 1>Max Quantity</input><button id='addResourceButton'>Add Resource</button></p></div>";
	document.querySelector('#app').innerHTML = finalHTML;
	
	document.querySelector('#addResourceButton').addEventListener('click', () =>
	  {
		  addResource();}
	  );
	  
	  const addResource = () => {
	  
	  var resourceName = document.querySelector('#resourceNameTextField').value;
	  resourceName = validateIdentifier(resourceName);

	  var quantity = document.querySelector('#resourceQuantityNumberField').value;

	  addResourceToDictionary(resourceName, quantity);
    redrawResources();
	
  };
  
	//setupCounter(document.querySelector('#counter'));
}

function validateIdentifier(id)
{
	var regexPattern = /[^A-Za-z0-9]/g;
	return id.replace(regexPattern, "");
	//return id.replaceAll(/\s+/g, '').replaceAll(".", "").replaceAll(",", "_").replaceAll(":", "_").replaceAll(";", "_").replaceAll("*", "_");
}

function redrawResources() {
 console.log("StartRedraw for player " + playerName);
 
  finalHTML = '';
  var count;
	if (dictResources[playerName] == null)
	{
		count = 0;
	}
	else
	{
		count = Object.keys(dictResources[playerName]).length;
	}
  
  if (count == 0) 
  {
    finalHTML += `<div><p>You don't have any resources. Add one!</p></div>`;
  } 
  else {
    finalHTML += `<div> <table width=100%>`;
    finalHTML += `<tr><td bgcolor="#80C0B0">  Resource  </td><td bgcolor="#A0E0D0">  Quantity  </td><td bgcolor="#A0E0D0">Reset</td></tr>`;
    Object.keys(dictResources[playerName]).forEach((resource) =>{
		var validatedResource = validateIdentifier(resource);
		console.log("Object found: " + validatedResource);
		  displayResourceRow(validatedResource)
    });
    finalHTML += `</table></div>`;
  }

  document.querySelector('#resourcePanel').innerHTML = finalHTML;

   
  if (count > 0)
  {
	  Object.keys(dictResources[playerName]).forEach((resource) =>
	  {
		  var resourceValidated = validateIdentifier(resource);
		setupResourceButton(

		  document.querySelector('#ItemRow' + resourceValidated),
		  resourceValidated,
		  resourceConsumed()
		);
		
		setupResetButton(
		  document.querySelector('#ItemReset' + resourceValidated),
		  resourceValidated,
		);
		
		setupEditResourceButton(
		  document.querySelector('#ItemEdit' + resourceValidated),
		  resourceValidated
		);
		
	});
	
  }

  document.querySelector('#selectedPlayerResources').innerHTML = "<b>" +playerName + "'s Resources</b>";
  
 
  document.querySelector('#addResourcePanel').style.display = "block";
  
  playerUpdate();
}

async function playerUpdate()
{
	await OBR.party.getPlayers().then((party) => {


		if (isGM)
		{
			var html = `<button id=buttonGM></button>`;
			party.forEach((element) => {html += `<button id=buttonplayer`+ validateIdentifier(element.name) + `></button>`});
			document.querySelector('#playerbuttons').innerHTML = html;

			party.forEach((element) =>
			{
				setupPlayerButton(
			  document.querySelector('#buttonplayer' + element.name.replace(/\s+/g, '')),
			  element.name.replace(/\s+/g, ''));
			});
			setupSelfButton(
			document.querySelector('#buttonGM'));	
		}
		else
		{
			document.querySelector('#playerbuttons').innerHTML = '';
		}
	
	});

}

function displayResourceRow(resource) {
  finalHTML += `<tr>`;
  finalHTML +=
    `<td><button id="ItemRow` +
    resource +
    `" type="button" height=20></button></td>`;
	
	console.log("Displaying: " + resource);

  var quantity = dictResources[playerName][resource].quantity;
  var consumed = dictResources[playerName][resource].consumed;
  
  if (quantity < 8)
  {
	  //finalHTML += '<td><table><tr><td>' + (quantity - consumed) + ' / ' + quantity + '</td></tr></table></td>';
	  var count = (quantity - consumed);
	  finalHTML += '<td><table><tr><td>';
	  
	  for (let i = 0; i < quantity; i++)
	  {
		  if (i < count)
		  {
			  finalHTML += "<img src='apple.svg'>";
		  }
		  else
		  {
			  finalHTML += "<img src='appleoff.svg'>";
		  }
	  }
	  finalHTML += '</td></tr></table></td>';
  }
  else
  {
	  finalHTML += '<td><table><tr><td>' + "<progress value="+ ((quantity - consumed)) +" max="+ (quantity)+">" +  '</progress></td>'
	  finalHTML += "<td style='font-size: 0.6em'>" + (quantity - consumed) + '/' + quantity + "</td></tr>";	
	  finalHTML += '</table></td>';
  }
  
  
  finalHTML += '<td><table><tr><td><button id="ItemReset' + resource + '" type="button">R</button></td>'
	+ '<td><button id="ItemEdit' + resource + '" type="button">?</button></td>'
	+'</tr></table></td>';
  finalHTML += `</tr>`;

}

async function searchForPlayerResources (name)
{
	var found = false;
	await OBR.party.getPlayers().then((party) => {
		party.forEach((player) => {
			if (player.name.replace(/\s+/g, '') == name)
			{
				console.log("Found player: " + player.name);
				displayPlayerResources(player);
				found = true;
				return;
				
			}
		});
		if (!found)
		{
			console.log("PlayerNotFound " + name);
			selectedPlayer = '';
			redrawResources();
		}
	
	});
}

async function displayPlayerResources(player)
{	var playerResources;
	console.log("StartRedraw for player " + player.name);
	if (player.metadata[`com.simplesr/metadata_resources`] == null)
	{
		console.log("no metadata found");
		playerResources = {};
	}
	else
	{
		playerResources = player.metadata[`com.simplesr/metadata_resources`];
	}
	
	console.log(playerResources);
	///////////////////////
	finalHTML = '';
	var count = Object.keys(playerResources).length;

	if (count == 0) 
	{
	finalHTML += `<div><p>Player ` + player.name + ` doesn't have any resources.</p></div>`;
	} 
	else {
	finalHTML += `<div> <table width=100%>`;
	finalHTML += `<tr><td bgcolor="#C080B0" width= 70%>  Resource  </td><td bgcolor="#E0A0D0">  Quantity  </td></tr>`;
	Object.keys(playerResources).forEach((resource) =>{
		console.log("Object found: " + resource);
		  displayFlatResourceRow(playerResources, resource)
	});
	finalHTML += `</table></div>`;
	}

	document.querySelector('#resourcePanel').innerHTML = finalHTML;

	document.querySelector('#selectedPlayerResources').innerHTML = "<b>" +player.name + "'s Resources</b>";
	
	document.querySelector('#addResourcePanel').style.display = "none";
	
	playerUpdate();
	
}

function displayFlatResourceRow(playerResources, resource) {
  finalHTML += `<tr>`;
  finalHTML +=
    `<td>` +
    resource +
    `</td>`;
	
	console.log("Displaying: " + resource);

  var quantity = playerResources[resource].quantity;
  var consumed = playerResources[resource].consumed;
  
  if (quantity < 8)
  {
	  //finalHTML += '<td><table><tr><td>' + (quantity - consumed) + ' / ' + quantity + '</td></tr></table></td>';
	  var count = (quantity - consumed);
	  finalHTML += '<td><table><tr><td>';
	  
	  for (let i = 0; i < quantity; i++)
	  {
		  if (i < count)
		  {
			  finalHTML += "<img src='apple.svg'>";
		  }
		  else
		  {
			  finalHTML += "<img src='appleoff.svg'>";
		  }
	  }
	  finalHTML += '</td></tr></table></td>';
  }
  else
  {
	  finalHTML += '<td><table><tr><td>' + "<progress value="+ ((quantity - consumed)) +" max="+ (quantity)+">" +  '</progress></td>'
	  finalHTML += "<td style='font-size: 0.6em'>" + (quantity - consumed) + '/' + quantity + "</td></tr>";	
	  finalHTML += '</table></td>';
  }
  
  finalHTML += `</tr>`;

}
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

function resourceConsumed(player, resource) {
  //document.querySelector('#counter').innerHTML = 'Pressed' + resource;
}

export function setupResourceButton(element, selectedname, callback) {
  let counter = 0;
  console.log (selectedname);
  element.innerHTML = `` + selectedname;

  const consumeResource = (selectedname) => {
    /*ounter = count;
    element.innerHTML = `setur is` + counter;*/
    dictResources[playerName][selectedname].consumed++;
    redrawResources();
	notifyResourceConsumed(playerName, selectedname, 1);
	updateMetadata();
  };
  element.addEventListener('click', () =>
    consumeResource(selectedname)
  );
}



export function setupResetButton(element, selectedname) {
  let counter = 0;
   console.log("Reset button element: " + element);
  const resetResource = (selectedname) => {

    dictResources[playerName][selectedname].consumed = 0;
    redrawResources();
	notifyResourceRestored(playerName, selectedname);
	updateMetadata();
  };
  element.addEventListener('click', () =>
    resetResource(selectedname)
  );
}

export function setupResetHalfButton(element, selectedname, quantity) {
  let counter = 0;
   
  const resetHalfResource = (selectedname, quantity) => {
	 console.log("Reset button element: " + selectedname);
    dictResources[playerName][selectedname].consumed -= quantity /2;
	
	if (dictResources[playerName][selectedname].consumed < 0)
	{
		dictResources[playerName][selectedname].consumed = 0;
	}
    redrawResources();
	notifyResourceRestored(playerName, selectedname);
	updateMetadata();
  };
  element.addEventListener('click', () =>
  {
	  resetHalfResource(selectedname, quantity);
  });
}



export function setupEditResourceButton(element, selectedname) {
  let counter = 0;
   
	const displayResourceConfig = (resourceName) => {
		var html = '';

		html += "<table style='width: 80%'>"

		html += `<tr><td bgcolor=#A0E0C0 colspan="2">Editing: <b>` + selectedname + `</b></td></tr>`;
		html += `<tr><td style="width: 130px"><input type ='number' id='inputCurrentValue' value = '`+
		(dictResources[playerName][selectedname].quantity - dictResources[playerName][selectedname].consumed)
		+`' style="width: 130px"></input></td><td>Current</td></tr>`;

		html += `<tr><td style="width: 130px"><input type ='number' id='inputMaxValue' value = '`
		+ dictResources[playerName][selectedname].quantity +`' style="width: 130px"></input></td><td>Max</td></tr>`;

		html += "<tr><td><button id='AddQuantity'>Add</button></td><td><input type='number' id=AddInputEdit value='0'></input></td></tr>";

		
		html += "<tr><td colspan='2'><button id='confirmChanges' style='height: 50px; width: 150px'>Confirm Changes</button></td>"
		+"</tr>"

		html += "<tr><td><button id='restoreHalf'>Recover ½</button></td>";
		html += "<td><button id='deleteResource'>Delete</button></td></tr>";

		html += "<tr><td></td><td><button id='closeConfig' style='width: 50px; background-color: #FF0000'>Cancel</button></td>";
		html += "</table>"

		document.querySelector('#addResourcePanel').style.display = "none";

		document.querySelector('#resourcePanel').innerHTML = html;

		//Listeners

		document.querySelector('#closeConfig').addEventListener('click', () => {
			redrawResources();
		});

		document.querySelector('#restoreHalf').addEventListener('click', () => {
			dictResources[playerName][selectedname].consumed -= Math.floor(dictResources[playerName][selectedname].quantity /2);
			if (dictResources[playerName][selectedname].consumed < 0)
			{
				dictResources[playerName][selectedname].consumed = 0;
			}
			updateMetadata();
			redrawResources();
		});
		
		document.querySelector('#deleteResource').addEventListener('click', () => {
			
			delete dictResources[playerName][selectedname];
			updateMetadata();
			redrawResources();
		});
		
		document.querySelector('#AddQuantity').addEventListener('click', () => {
			var q = parseInt(document.querySelector('#AddInputEdit').value);
			
			dictResources[playerName][selectedname].quantity = (parseInt(dictResources[playerName][selectedname].quantity) + q);
			if (dictResources[playerName][selectedname].consumed > dictResources[playerName][selectedname].quantity)
			{
				dictResources[playerName][selectedname].consumed = dictResources[playerName][selectedname].quantity;
			}
			updateMetadata();
			redrawResources();
		});
		
		document.querySelector('#confirmChanges').addEventListener('click', () => {
			
			dictResources[playerName][selectedname].quantity = document.querySelector('#inputMaxValue').value;
			dictResources[playerName][selectedname].consumed = parseInt(dictResources[playerName][selectedname].quantity) - parseInt(document.querySelector('#inputCurrentValue').value);
			updateMetadata();
			redrawResources();
		});
		

	};
	element.addEventListener('click', () =>
	{
	  displayResourceConfig(selectedname);
	});
}

function removeFromDict(value) { 
    
	const index = dictResources[playerName].indexOf(value);
	if (index > -1) { 
		dictResources[playerName].splice(index, 1);
}

	/*for( var i = 0; i < dictResources[playerName].length; i++){ 
                                   
        if ( dictResources[playerName][i] === value) { 
            dictResources[playerName].splice(i, 1); 
            i--; 
        }
    }*/

}


export function setupPlayerButton(element, playername) {

  element.innerHTML = `` + playername;

  const selectPlayer = (player) => {
	  selectedPlayer = player;
    searchForPlayerResources(player);
	
  };
  element.addEventListener('click', () =>
    selectPlayer(playername)
  );
}

export async function setupSelfButton(element) {
	
	await OBR.player.getName().then((yourName) => {
			playerName = yourName;
			element.innerHTML = `` + yourName + " (you)";
			
			element.addEventListener('click', () =>
    selectSelfPlayer(yourName));
	//document.querySelector('#selectedPlayerResources').innerHTML = playerName + "'s Resources";
		}); 
 
  
  
}
	
const selectSelfPlayer = (player) => {
	  selectedPlayer = player;
    redrawResources();
  };

function notifyResourceConsumed (resource, quantity)
{
	OBR.notification.show(`Player "${playerName}" consumed ${resource} x${quantity}`);
}

function notifyResourceRestored (resource)
{
	OBR.notification.show(`Player "${playerName}" RESTORED ${resource}`);
}


async function updateMetadata()
{
	let  resourcesMeta = {};
	console.log("updating Metadata for player " + playerName);
	resourcesMeta[`com.simplesr/metadata_resources`] = dictResources[playerName];
	
	await OBR.player.setMetadata(resourcesMeta).then(() => {
		console.log("Metadata updated -- " + JSON.stringify(resourcesMeta));
	    showMetadataInfo();
	});
	
	window.localStorage.setItem("com.simplesr.metadata_resources", JSON.stringify(dictResources));
}

async function showMetadataInfo()
{
	await OBR.player.getMetadata().then ((md) => {
		console.log("working in ");
		
		var dicti = md[`com.simplesr/metadata_resources`];
		
		if (dicti != null)
		{
			Object.keys(dicti).forEach((resource) =>{
			console.log("Metadata: " + resource);
			console.log("Metadata: " + resource + "---" + dicti[resource].quantity + "---" + dicti[resource].consumed);
			});
		}
	});
}
