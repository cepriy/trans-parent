let mainInput=document.getElementById("mainInput");
let btnTermEntry=document.getElementById("btnFind");
let btnThesaurus=document.getElementById("btnThesaurus");
btnTermEntry.innerHTML="Термінологічна картка";
btnTermEntry.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["termEntryBtn"];
btnThesaurus.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["theraurusBtn"];

let sustrMaxLength = 6 // the string before searched will be cut up to this character

//alert ($('#selectLang'));
//alert($("input[name='language']:checked").val());


const langRowMap = new Map()
langRowMap['Ukrainian'] = 0;
langRowMap['English'] = 1;
langRowMap['Spanish'] = 2;
langRowMap['Portuguese'] = 3;


function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;

                entries = JSON.parse(allText);

            }
        }
    }
    rawFile.send(null);
}


readTextFile("gloss_transl.json");


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}


function GetTermList(entries)
{
    let termList = new Array();
    entries.forEach(function (element, index) {
        let splitList = element['Term'].split(",");
        if (index > 0) termList = termList.concat(splitList);
         splitList = element['Term_in_Spanish'].split(",");
        if (index > 0) termList = termList.concat(splitList);
    });

    let uniqueTermsList = termList.filter(onlyUnique);

    $(document).ready(function(){

        $("#mainInput").autocomplete(

            {
                minLength: 2,
                delay: 20,
                source:uniqueTermsList
            });
    });
}

GetTermList(entries);

function preprocessTerm(term){
    term = term.toLowerCase().trim();
    if (term.length > sustrMaxLength){

        if (term.includes(" ")){

            let arr = term.split(" ");

            if (arr[0].length >= sustrMaxLength && arr[1].length>=sustrMaxLength){
                term = arr[0].substring(0, sustrMaxLength)+".* "+ arr[1].substring(0, sustrMaxLength)+".*";

            }
            else if (arr[0].length >= sustrMaxLength && arr[1].length < sustrMaxLength){
                term = arr[0].substring(0, sustrMaxLength)+".* "+ arr[1]+".*";
            }

            else if (arr[0].length < sustrMaxLength && arr[1].length >= sustrMaxLength){
                term = arr[0]+".* "+ arr[1].substring(0, sustrMaxLength)+".*";
            }
            else {
                term = arr[0]+".* "+ arr[1]+".*";
            }
        }
        else {
            term = term.substring(0, sustrMaxLength) + ".*";
        }

    }
    return term;
}


function makeThesaurus(term){

    if (mainInput.value === "") {return;}

    term = preprocessTerm(term);
    divOutput.innerHTML="";

    for (var i=0; i<entries.length; i++) {
        Object.keys(entries[i]).forEach(function (element){

            let separator =  term.substring(0, term.indexOf("."));

            if (element.includes("Thes_") && entries[i][element] && (new RegExp(term).test(entries[i][element].toString()) || new RegExp(term).test(entries[i]['Term'].toString()))  )
            {
                let  splitParts = entries[i][element].split(separator); // TO HIGHLIGHT THE TERM IN QUESTION
                let entryTerm = entries[i]['Term'].bold();
                divOutput.innerHTML +=entryTerm+" "+  entries[langRowMap[$("input[name='language']:checked").val()]][element].italics()+" "+  entries[i][element] + " ("+entries[i]['Author']+" "+entries[i]['Work_title']+") "+"<br/>";

               //  makeSecondaryThesaurus(entries[i][element].toString());
            }
        });
    }
        Object.keys(entries[langRowMap[$("input[name='language']:checked").val()]]).forEach(function (element){
            if (element.includes("Thes_trans"))
            {
                makeChain(term, element);
            }
       });
}


function outputTermEntry(entry, term){
    Object.keys(entry).forEach(function (element){
        let  splitParts = [];
        console.log("Term and entry[element]");
        console.log(term.length+" "+entry[element].length);
        if( entry[element] && entry[element].length > term.length) {
              splitParts = entry[element].toString().split(term);

        } // TO HIGHLIGHT THE TERM IN QUESTION
        if (entry[element]===""|| !entry[element]) return;
        if (splitParts.length>1){
             divOutput.innerHTML += entry["Term"]+" "+entries[langRowMap[$("input[name='language']:checked").val()]][element].italics()+" "+ splitParts[0]+term.bold()+splitParts[1]+"<br/>";
        }
        else {
            divOutput.innerHTML +=  entry["Term"]+" "+entries[langRowMap[$("input[name='language']:checked").val()]][element].italics()+" "+ entry[element]+"<br/>";
        }

    });
    divOutput.innerHTML +="<br/>";
}

function find(term)
{
    if (mainInput.value === "") {return;}

    term = preprocessTerm(term);
    divOutput.innerHTML="";

    for (var i=0; i<entries.length; i++)
    {
        if(new RegExp(term).test(entries[i].Term.toLowerCase())  || new RegExp(term).test(entries[i].Term_in_Spanish
            .toLowerCase()))
        {
            outputTermEntry(entries[i], term);
        }
    }
}

function makeChain(term, thesaurusFunction){

    for (var i=1; i<entries.length; i++) {// Because the first row contains the function´s explanation in Ukrainian
        console.log("Entry");
        console.log(entries[i][thesaurusFunction]);
       if( !entries[i][thesaurusFunction] || entries[i][thesaurusFunction]==="") {return;}
            if ( new RegExp(term).test(entries[i]["Term"].toString().toLowerCase()) && term!=entries[i][thesaurusFunction] && entries[i][thesaurusFunction] && !(new RegExp(term).test(entries[i][thesaurusFunction].toString().toLowerCase())) )
            {
            //    alert("found " + term)

                let entryTerm = entries[i]['Term'].bold();
                divOutput.innerHTML +="----- " + entryTerm+" "+ entries[langRowMap[$("input[name='language']:checked").val()]][thesaurusFunction].italics()+" "+entries[i][thesaurusFunction] +"<br/>";

                let components = entries[i][thesaurusFunction].toString().split(",");
              //  alert(components)
                components.forEach(function (component) {

                       makeChain(component.trim(), thesaurusFunction);

                    });
            }
    }
}

$('#btnFind').click(function (){find(mainInput.value)});
$('#btnFindRelated').click(function (){makeThesaurus(mainInput.value)});
$("#langSelect").change(function (){
    btnTermEntry.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["termEntryBtn"];
    btnThesaurus.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["theraurusBtn"];


});


