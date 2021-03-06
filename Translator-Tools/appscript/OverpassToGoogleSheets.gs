function OverpassToGoogleSheets() {
    //Convert response into rows.
    //Show web popup of map?
    //Suggest using Wikidata | Xlate memory?.
    //Allow verification.
    //Allow download of josm / other upload file.
    //Explore using OSM API to directly upload.
        
    //OverpassQueryBuilder();
    //GetOverpassQueryFromUser()
    
    var query = '[out:json][timeout:3600];(area[name="Malaysia"];node["place"](area)["name:ta"!~"."](area););out meta;>;out meta qt;'
    var jsonresponse = QueryOverpass(query);
    ParseReponsePopulateSheets(jsonresponse);
}

function ParseReponsePopulateSheets(jsonresponse) {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    if (doc.getSheetByName('OverpassOutput') != null)
      doc.deleteSheet(doc.getSheetByName('OverpassOutput'));
    var sheet = doc.insertSheet('OverpassOutput');
    //Logger.clear();
    var OSMdataAll = JSON.parse(jsonresponse.getContentText());    
    
    var data = OSMdataAll.elements;
    var OSMdata = [];
    var count = 0;    
    var OSMNodedata = [];
    sheet.getRange(2,1,1,7).setValues(["Node ID","Name","Lat","Lon","Type","Google Translate","Wikidata Translate"]);
    for(element in OSMdataAll.elements) {
      OSMdata = [];
      OSMNodedata['id'] = "=HYPERLINK(CONCATENATE(\"www.openstreetmap.org/node/\"," + data[element]['id'] + ")," + data[element]['id'] + ")"
      OSMNodedata['name'] = data[element]['tags']['name'];
      OSMNodedata['lat'] = data[element]['lat'];
      OSMNodedata['lon'] = data[element]['lon'];
      OSMNodedata['place'] = data[element]['tags']['place'];      
      OSMNodedata['googx'] = "=GOOGLETRANSLATE(\"" + OSMNodedata['name'] + "\",\"en\",\"ta\")";
      OSMNodedata['wikix'] = QueryWikidata(OSMNodedata['name']);
      //TODO Add xliterate option
      
      //Logger.log(OSMNodedata);      
      OSMdata.push([OSMNodedata['id'],OSMNodedata['name'],OSMNodedata['lat'],OSMNodedata['lon'],OSMNodedata['place'],OSMNodedata['googx'],OSMNodedata['wikix']]);
      count++;
      
      sheet.getRange(2+count,1,1,7).setValues(OSMdata);
      
    }
    //Logger.log(OSMdata);
    
}

function OverpassQueryBuilder() {
    //Generate Overpass Queries using common query template and defined inputs?
    /*
    * City / Area
    * Target Language
    * Untranslated / Review / All
    * Node / Relation / Ways / POIs
    * Filter
    */
}

function GetOverpassQueryFromUser() {
    var ui = SpreadsheetApp.getUi();  
    var response = ui.prompt('Overpass Query', 'Input OverpassQuery with json output', ui.ButtonSet.OK_CANCEL);
    
    if (response.getSelectedButton() == ui.Button.OK) {
      query = response.getResponseText();
      //Logger.log(query);
  }
  return query;

}

function QueryOverpass(query) {
    Logger.clear();
    var url = 'http://overpass-api.de/api/interpreter';
    var options = {
        'method': 'post',
        'payload': query
    };
    var jsonresponse = UrlFetchApp.fetch(url, options);
    Logger.log('End of QueryOverpass');
    return jsonresponse;
}


function QueryWikidata(query) {
    Logger.clear();

    var HEADERS = { headers: {'X-User-Agent': 'OSM Translation using Google Spreadsheets'} };
    var url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=' + query + '&languages=ta&props=labels&format=json';

    var jsonresponse = UrlFetchApp.fetch(url, HEADERS);
    var data = JSON.parse(jsonresponse.getContentText());
    //Logger.log(data.entities);
    for (entity in data.entities) {
      if(data.entities[entity].hasOwnProperty('labels')) {
        if (data.entities[entity].labels.hasOwnProperty('ta')) {
          return data.entities[entity].labels.ta.value;
        }
      }
    }
    return "";
}