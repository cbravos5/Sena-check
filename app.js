$(document).ready(function () {
  let loaded = false; //variable to verify if the games results history is loaded
  const numbers = $(".numbers-table");
  let empty = 6; //keep track the number of empty inputs
  let drawns, tableContent; //games history and table
  const inputs = $("input");

  //Number of reps for every drawn
  // prettier-ignore
  const reps = [
    231, 239, 212, 252, 257, 240, 221, 233, 217,
    267, 238, 230, 238, 222, 206, 243, 243, 235,
    218, 227, 203, 204, 255, 245, 216, 193, 251,
    249, 240, 247, 220, 235, 257, 246, 243, 242,
    250, 235, 220, 224, 242, 254, 245, 241, 229,
    231, 225, 212, 236, 234, 240, 239, 267, 248,
    199, 238, 222, 231, 227, 218
  ];

  //insert numbers into table
  const insertNumbers = () => {
    for (let i = 1; i <= 60; i++) {
      const content = ("0" + i).slice(-2);
      const element = $("<button/>").text(`[${content}]`);
      element.addClass("number");
      element.attr("content", content);
      numbers.append(element);
    }
  };

  //function triggered to animate 'carregar' button and unbind event handlers
  const setCheck = () => {
    $("#not-loaded").addClass("hidden").removeClass("visible");
    setTimeout(() => {
      $("#load").css("background-position", "left bottom");
    }, 200);
    setTimeout(() => {
      $("#loaded").removeClass("hidden").addClass("visible");
    }, 300);
    setTimeout(() => {
      $("#load").css("background-position", "right bottom");
    }, 1000);
    $("#load").unbind("click");
  };

  //ajax request to get the history
  const load = () => {
    $.ajax({
      url: "./concursosP.json",
      type: "GET",
      dataType: "json",
      success: function (data) {
        drawns = data;
      },
    });
    loaded = true;
    setCheck(); //animate and unbind
  };

  //verify the inputs in three cases
  //if the input is out of bounds, then the box is emptied and a warning is triggered
  //if the input has length 3, then the last number is thrown away
  //if the input has length 2, then the focus change to the next box
  function verifyInput(input) {
    const { value } = input[0];
    const length = value.toString().length;
    if (value < 1 || value > 60) {
      input[0].value = "";
      showAlert(true);
      return;
    }
    switch (length) {
      case 2:
        input.next("input").focus();
        break;
      case 3:
        input[0].value = parseInt(value.toString().substr(0, value.length - 1));
      default:
        break;
    }
    //every input change can trigger a verification for matches, except if
    //the history is not loaded
    if (loaded) {
      check();
    }
  }

  //function triggered on hover. Shows the reps of hovered number
  const setReps = (number) => {
    $(".drawn")
      .find("h2")
      .text(`O número ${number} foi sorteado ${reps[number - 1]} vezes`);
    $(".drawn").css("opacity", "1");
  };

  //Function triggered when the button clicked is already selected
  //remove background color and change click handler
  const removeNumberAndUnlockButton = (event) => {
    const target = $(event.target);
    target.toggleClass("number-selected");
    inputs.each(function () {
      if ($(this)[0].value == target.attr("content")) {
        $(this)[0].value = "";
        ++empty;
        return false;
      }
    });
    target.unbind("click"); //remove previous handler
    if (loaded) {
      check();
    }
    target.on("click", (event) => putNumberAndLockButton(event)); //add new handler
  };

  //Function triggered when the button clicked isn't selected
  //add background color and change click handler
  const putNumberAndLockButton = (event) => {
    if (empty > 0) {
      const target = $(event.target);
      target.toggleClass("number-selected");
      inputs.each(function () {
        if ($(this)[0].value == "") {
          $(this)[0].value = target.attr("content");
          --empty;
          return false;
        }
      });
      target.unbind("click");
      if (loaded) {
        check();
      }
      target.on("click", (event) => removeNumberAndUnlockButton(event));
    }
  };

  //sets all the handlers for inputs and table numbers
  const setInputHandlers = () => {
    inputs.each(function () {
      $(this).on("input", () => verifyInput($(this)));
    });
    tableContent.each(function () {
      $(this).on("mouseenter", () => setReps($(this).attr("content")));
      $(this).on("click", (event) => putNumberAndLockButton(event));
    });
  };

  //checks if the number is present in the game
  //prior optmization with sort algorithm lead to better performance
  //if the number is smaller than the drawned one, then is not possible to match
  const checkNumberPresence = (value, drawn) => {
    let k = 1;
    let possible = true;
    while (possible && k < 7) {
      if (value == drawn["n" + k]) {
        return true;
      } else if (parseInt(value) < parseInt(drawn["n" + k])) {
        possible = false;
      } else {
        k++;
      }
    }
    return false;
  };

  //adds the matched game to corresponding type (quadra,quina,sena)
  //pushes the match to a list
  const addToWonList = (match, quadra, quina, sena, drawn) => {
    let concurso = {
      Concurso: drawn["Concurso"],
      Data: drawn["Data"],
      Numeros: [
        drawn["n1"],
        drawn["n2"],
        drawn["n3"],
        drawn["n4"],
        drawn["n5"],
        drawn["n6"],
      ],
    };
    switch (match) {
      case 4:
        quadra.push(concurso);
        break;
      case 5:
        quina.push(concurso);
        break;
      case 6:
        sena.push(concurso);
        break;
    }
  };

  //adds the drawns data to DOM
  const setHTML = (type, content) => {
    $(`#${type}`).find(".n").text(content.length.toString()); //number of wons per type
    $(`#${type}`).append(
      content.map((drawn) => {
        const [n1, n2, n3, n4, n5, n6] = drawn["Numeros"];
        return `<div class="spotlight">
                <h4>
                  Concurso: <p class="concurso"> ${drawn["Concurso"]} </p> 
                  Data: <p class="data"> ${drawn["Data"]} </p>
                  Números: <p class="drawn-numbers"> ${n1}-${n2}-${n3}-${n4}-${n5}-${n6} </p>  
                </h4>
                <div>`;
      })
    ); //Number of the drawn, date and drawned numbers inside the html tags
  };

  //empties the html and sets the results for every type
  const setResults = (quadra, quina, sena) => {
    $(".spotlight").remove();
    $(".n").text("0");
    setHTML("sena", sena);
    setHTML("quina", quina);
    setHTML("quadra", quadra);
  };

  //shows alert based on default value 'outOfBounds'
  //sets html content to proper alert and do a fade effect
  const showAlert = (outOfBound = false) => {
    if (outOfBound) {
      $(".alert").html(
        "<strong>A mega sena sorteia somente números de 1 a 60<strong>"
      );
    } else {
      $(".alert").html(
        "<strong>Atenção!!!</strong> Você deve clicar em carregar antes de conferir os números"
      );
    }
    $(".alert").css("opacity", "1");
    setTimeout(() => {
      $(".alert").css("opacity", "0");
    }, 6000);
  };

  //function iterate for every game and matches it to inputs values
  const check = async () => {
    if (loaded) {
      let quadra, quina, sena;
      quadra = [];
      quina = [];
      sena = [];
      let k = 0;
      let values = new Array(6);
      inputs.each(function () {
        values[k] = $(this)[0].value;
        k++;
      });
      //iterate history
      drawns.forEach((drawn) => {
        let match = 0;
        for (let i = 0; i < 6; i++) {
          if (checkNumberPresence(values[i], drawn)) {
            match++;
          }
        }
        if (match > 3) {
          //if match is at least a 'quadra' then adds to type list
          addToWonList(match, quadra, quina, sena, drawn);
        }
      });
      setResults(quadra, quina, sena);
    } else {
      showAlert();
    }
  };

  //initial assignments
  insertNumbers();
  tableContent = $(".number");
  setInputHandlers();
  $("#load").click(load);
  $("#check").click(check);
});
