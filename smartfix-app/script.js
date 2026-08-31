const statusFilter = document.getElementById("statusFilter");
const regionFilter = document.getElementById("regionFilter");
const searchInput = document.getElementById("searchInput");

const rows = document.querySelectorAll("#ordersTable tr");


// FUNÇÃO DE FILTRO

function filterOrders() {

    const selectedStatus = statusFilter.value;
    const selectedRegion = regionFilter.value;
    const searchText = searchInput.value.toLowerCase();


    rows.forEach(row => {

        const status = row.dataset.status;
        const region = row.dataset.region;

        const rowText = row.innerText.toLowerCase();


        const statusMatch =
            selectedStatus === "todos" ||
            status === selectedStatus;


        const regionMatch =
            selectedRegion === "todos" ||
            region === selectedRegion;


        const searchMatch =
            rowText.includes(searchText);


        if (
            statusMatch &&
            regionMatch &&
            searchMatch
        ) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}


// EVENTOS

statusFilter.addEventListener(
    "change",
    filterOrders
);


regionFilter.addEventListener(
    "change",
    filterOrders
);


searchInput.addEventListener(
    "input",
    filterOrders
);



// MODAL DE CONFLITO

function openConflict() {

    const modal =
        document.getElementById("conflictModal");

    modal.classList.add("active");

}


function closeConflict() {

    const modal =
        document.getElementById("conflictModal");

    modal.classList.remove("active");

}



// SALVAR MEDIAÇÃO

function saveMediation() {

    alert(
        "Mediação registrada com sucesso!"
    );

    closeConflict();

}



// FECHAR MODAL CLICANDO FORA

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById("conflictModal");

        if (event.target === modal) {

            closeConflict();

        }

    }
);