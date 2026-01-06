let currentPage = 1;
let searchName = "";
let statusFilter = "";

const nextBtn = document.getElementById("nextPage");
const prevBtn = document.getElementById("prevPage");
const pageInfo = document.getElementById("pageInfo");

const searchInput = document.getElementById("searchInput");
const cleanBtn = document.getElementById("clearSearch");

const statusButtons = document.querySelectorAll(".filters .chip");

const isLoaded = document.getElementById("resultsInfo");


cleanBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchName = "";
  currentPage = 1;
  loadCharacters(currentPage);
});

async function loadCharacters(page) {
  try {
    showLoading(true);

    const { characters, info } = await arrayCharacters(
      page,
      searchName,
      statusFilter
    );

    if (pageInfo) {
      pageInfo.textContent = `Página ${currentPage} de ${info.pages}`;
    }

    if (characters.length === 0) {
      isLoaded.textContent = "No hay resultados para tu búsqueda/filtro.";
    } else if (statusFilter === "alive") {
      isLoaded.textContent = "Lista de personajes vivos:";
    } else if (statusFilter === "dead") {
      isLoaded.textContent = "Lista de personajes muertos:";
    } else if (statusFilter === "unknown") {
      isLoaded.textContent = "Lista de personajes desconocidos:";
    } else {
      isLoaded.textContent = "Lista de todos los personajes:";
    }

    showLoading(false);

    renderCharacters(characters);

    nextBtn.disabled = !info.next;
    prevBtn.disabled = !info.prev;
  } catch (error) {
    console.log(error);
    showLoading(false);
  }
}

async function arrayCharacters(page, searchName = "", statusFilter = "") {
  try {
    const url = new URL("https://rickandmortyapi.com/api/character");
    url.searchParams.set("page", page);
    if (searchName.trim()) url.searchParams.set("name", searchName.trim());

    if (statusFilter) url.searchParams.set("status", statusFilter);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          characters: [],
          info: { next: null, prev: null, pages: 0, count: 0 },
        };
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return { characters: data.results, info: data.info };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function renderCharacters(characters) {
  const containerCards = document.getElementById("cardsGrid");
  if (!containerCards) return;

  containerCards.innerHTML = "";

  characters.forEach((c) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const img = document.createElement("img");
    img.classList.add("card__img");
    img.src = c.image;
    img.alt = c.name;

    const body = document.createElement("div");
    body.classList.add("card__body");

    const name = document.createElement("h3");
    name.classList.add("card__title");
    name.textContent = c.name;

    const badges = document.createElement("div");
    badges.classList.add("badges");

    const status = document.createElement("span");
    status.classList.add("badge");
    status.textContent = c.status;

    const statusLower = c.status.toLowerCase();
    if (statusLower === "alive") status.classList.add("badge--alive");
    else if (statusLower === "dead") status.classList.add("badge--dead");
    else status.classList.add("badge--unknown");

    const species = document.createElement("span");
    species.classList.add("badge");
    species.textContent = c.species;

    badges.append(status, species);
    body.append(name, badges);
    card.append(img, body);
    containerCards.appendChild(card);
  });
}

searchInput.addEventListener("input", () => {
  searchName = searchInput.value.trim();
  currentPage = 1;
  loadCharacters(currentPage);
});

nextBtn.addEventListener("click", () => {
  currentPage++;
  loadCharacters(currentPage);
});

prevBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  currentPage--;
  loadCharacters(currentPage);
});

document.addEventListener("DOMContentLoaded", () => {
  loadCharacters(currentPage);
});

statusButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // 1) leer el status del botón
    const status = btn.dataset.status;

    // 2) actualizar estado global
    statusFilter = status === "all" ? "" : status;
    currentPage = 1;

    // 3) UI: marcar activo
    statusButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    // 4) recargar personajes
    loadCharacters(currentPage);
  });
});

function showLoading(isLoading) {
  const containerCards = document.getElementById("cardsGrid");
  if (!containerCards) return;

  containerCards.innerHTML = isLoading ? "<p>Cargando personajes...</p>" : "";
}
