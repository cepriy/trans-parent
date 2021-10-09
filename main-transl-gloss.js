let mainInput = document.getElementById("mainInput");
let btnTermEntry = document.getElementById("btnFind");
let btnThesaurus = document.getElementById("btnThesaurus");
let btnGenerateStatmnts = document.getElementById("btnGenerateStatmnts");
btnTermEntry.innerHTML = "Термінологічна картка";
btnTermEntry.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["termEntryBtn"];
btnThesaurus.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["theraurusBtn"];
btnGenerateStatmnts.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["generateBtn"];
let padding = "-----";

let sustrMaxLength = 6 // the string before searched will be cut up to this character
let startingTermsRowNumber = 4 // the number of row where the field names translations finish and term explanation starts

let foundChainValues = new Array(); // TODO: store here all the found values, use this array to come out of recursion if the value is already stored
let recursionCounterKostyl = 0;


//alert ($('#selectLang'));
//alert($("input[name='language']:checked").val());


const langRowMap = new Map()
langRowMap['Ukrainian'] = 0;
langRowMap['English'] = 1;
langRowMap['Spanish'] = 2;
langRowMap['Portuguese'] = 3;


function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                allText = rawFile.responseText;

                entries = JSON.parse(allText);
              //  alert(entries[entries.length-1]['Term']);

            }
        }
    }
    rawFile.send(null);
}


readTextFile("gloss-transl.json");


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}


 function GetTermList(entries) {
     termList = new Array();
    entries.forEach(function (element, index) {
        let splitList = element['Term'].split(",");
        if (index > startingTermsRowNumber) termList = termList.concat(splitList);
        splitList = element['Term_in_Spanish'].split(",");
        if (index > startingTermsRowNumber) termList = termList.concat(splitList);
    });

    let uniqueTermsList = termList.filter(onlyUnique);

    $(document).ready(function () {

        $("#mainInput").autocomplete(
            {
                minLength: 2,
                delay: 20,
                source: uniqueTermsList
            });
    });

    return termList;
}

termList = GetTermList(entries);

function preprocessTerm(term) {
    term = term.toLowerCase().trim();
    if (term.length > sustrMaxLength) {

        if (term.includes(" ")) {

            let arr = term.split(" ");

            if (arr[0].length >= sustrMaxLength && arr[1].length >= sustrMaxLength) {
                term = arr[0].substring(0, sustrMaxLength) + ".* " + arr[1].substring(0, sustrMaxLength) + ".*";

            } else if (arr[0].length >= sustrMaxLength && arr[1].length < sustrMaxLength) {
                term = arr[0].substring(0, sustrMaxLength) + ".* " + arr[1] + ".*";
            } else if (arr[0].length < sustrMaxLength && arr[1].length >= sustrMaxLength) {
                term = arr[0] + ".* " + arr[1].substring(0, sustrMaxLength) + ".*";
            } else {
                term = arr[0] + ".* " + arr[1] + ".*";
            }
        } else {
            term = term.substring(0, sustrMaxLength) + ".*";
        }

    }
    return term;
}


function makeThesaurus(term) {
    if (mainInput.value === "") {
        return;
    }

    term = preprocessTerm(term);
    divOutput.innerHTML = "";

    for (var i = startingTermsRowNumber; i < entries.length; i++) {
        Object.keys(entries[i]).forEach(function (element) {

            let separator = term.substring(0, term.indexOf("."));

            if (element.includes("Thes_") && entries[i][element] && (new RegExp(term).test(entries[i][element].toString().toLowerCase()) || new RegExp(term).test(entries[i]['Term'].toString().toLowerCase()))) {
                let explanation = entries[i][element];
                let splitParts = entries[i][element].split(separator); // TO HIGHLIGHT THE TERM IN QUESTION

                if (splitParts.length > 1){
                 explanation = explanation.substring(0, explanation.indexOf(separator))+explanation.substring(explanation.indexOf(separator), explanation.indexOf(separator)+separator.length).bold() + explanation.substring(explanation.indexOf(separator)+separator.length, explanation.length)
                }

                let entryTerm = entries[i]['Term'].bold();
                divOutput.innerHTML += entryTerm + " " + entries[langRowMap[$("input[name='language']:checked").val()]][element].italics() + " " + explanation + " (" + entries[i]['Author'] + " " + entries[i]['Work_title'] + ") " + "<br/>";

                //  makeSecondaryThesaurus(entries[i][element].toString());
            }
        });
    }
    Object.keys(entries[langRowMap[$("input[name='language']:checked").val()]]).forEach(function (element) {
        if (element.includes("Thes_trans")) {
          //  alert (term + " "+element);
            padding = "-----";   // To set up the indentation to the initial position, before a chain of function starts
            recursionCounterKostyl = 0;
            makeChain(term, element);
        }
    });
}


function outputTermEntry(entry, term) {
    Object.keys(entry).forEach(function (element) {
        let splitParts = [];
        console.log("Term and entry[element]");
        console.log(term.length + " " + entry[element].length);
        if (entry[element] && entry[element].length > term.length) {
            splitParts = entry[element].toString().split(term);

        } // TO HIGHLIGHT THE TERM IN QUESTION
        if (entry[element] === "" || !entry[element]) return;
        if (splitParts.length > 1) {
            divOutput.innerHTML += entry["Term"] + " " + entries[langRowMap[$("input[name='language']:checked").val()]][element].italics() + " " + splitParts[0] + term.bold() + splitParts[1] + "<br/>";
        } else {
            divOutput.innerHTML += entry["Term"] + " " + entries[langRowMap[$("input[name='language']:checked").val()]][element].italics() + " " + entry[element] + "<br/>";
        }

    });
    divOutput.innerHTML += "<br/>";
}

function find(term) {
    if (mainInput.value === "") {
        return;
    }

    term = preprocessTerm(term);
    divOutput.innerHTML = "";

    for (var i = startingTermsRowNumber; i < entries.length; i++) {
        if (new RegExp(term).test(entries[i].Term.toLowerCase()) || new RegExp(term).test(entries[i].Term_in_Spanish
            .toLowerCase())) {
            outputTermEntry(entries[i], term);
        }
    }
}

function makeChain(term, thesaurusFunction) {

    if (recursionCounterKostyl > 5) {

        return;
    }

   // if ( !(new RegExp(term).test(termList))) return;


      for (var i = startingTermsRowNumber; i < entries.length; i++) {// Because the first four rows contain the function´s explanation in Ukrainian
          if  (i >= ( entries.length-1) && (!entries[i][thesaurusFunction] || entries[i][thesaurusFunction] === "")) {
              return; // To come out of the recursion, if a field with function is blank or if the quiered term does not exist.
          }

        if (new RegExp(term).test(entries[i]["Term"].toString().toLowerCase())
            && term!=entries[i][thesaurusFunction].toString().toLowerCase()) //to avoid perpetual recursion if, e,g ´a´ is synonym of ´a´
        {
            // alert("found " + term)

            if  (!entries[i][thesaurusFunction] || entries[i][thesaurusFunction] === "") {
                return; // To come out of the recursion, if a field with function is blank or if the quiered term does not exist.
            }

            let entryTerm = entries[i]['Term'].bold();
            console.log("Entry term: " + entryTerm)
            divOutput.innerHTML += padding+  entryTerm + " " + entries[langRowMap[$("input[name='language']:checked").val()]][thesaurusFunction].italics() + " " + entries[i][thesaurusFunction] + "<br/>";
            //  alert( divOutput.innerHTML)
            let components = entries[i][thesaurusFunction].toString().split(",");
           // alert(components);
            padding += "----";  // To add indentation at each recursion level
            components.forEach( function(component){
                component = preprocessTerm(component);
              //  alert(component)
                recursionCounterKostyl++;
                console.log ("Recursion counter " + recursionCounterKostyl);
                makeChain(component,thesaurusFunction);
            });

        }
    }
}

function  generateStatements(term){

        if (mainInput.value === "") {
            return;
        }
    divOutput.innerHTML += term.bold();
        term = preprocessTerm(term);
        divOutput.innerHTML = "";

        for (var i = startingTermsRowNumber; i < entries.length; i++) {
            Object.keys(entries[i]).forEach(function (element) {

                let separator = term.substring(0, term.indexOf("."));

                if (element.includes("Thes_") && entries[i][element] && (new RegExp(term).test(entries[i][element].toString()) || new RegExp(term).test(entries[i]['Term'].toString()))) {
                    //   let splitParts = entries[i][element].split(separator); // TO HIGHLIGHT THE TERM IN QUESTION
                    let entryTerm = entries[i]['Term'];
                    divOutput.innerHTML += entryTerm + " " + entries[4][element] + " '" + entries[i][element] + "' " +"."; //TODO: modify the hardcodeа 4 stands for the fifth row in excel with statements predicatees

                    //  makeSecondaryThesaurus(entries[i][element].toString());
                }
            });
        }


}

$('#btnFind').click(function () {
    find(mainInput.value)
});
$('#btnThesaurus').click(function () {
    makeThesaurus(mainInput.value)
});
$('#btnGenerateStatmnts').click(function () {
    generateStatements(mainInput.value)
});


$("#langSelect").change(function () {
    btnTermEntry.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["termEntryBtn"];
    btnThesaurus.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["theraurusBtn"];
    btnGenerateStatmnts.innerHTML = langUpdateArray[$("input[name='language']:checked").val()]["generateBtn"];
});


