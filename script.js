// ===============================
// ESTADO GLOBAL DE LA APP
// ===============================

// Página actual de la API
let currentPage = 1;

// Texto buscado por nombre
let searchName = "";

// Filtro por estado (alive / dead / unknown)
let statusFilter = "";

// Personajes actualmente cargados (la página actual)
let currentCharacters = [];


// ===============================
// FAVORITOS (LOCAL STORAGE)
// ===============================

// Clave usada para guardar favoritos en el navegador
const Favorites_key = "rm_favorites";

// Array en memoria con IDs favoritos
let favorites = [];


// ===============================
// REFERENCIAS DEL DOM
// ===============================

const nextBtn = document.getElementById("nextPage");
const prevBtn = document.getElementById("prevPage");
const pageInfo = document.getElementById("pageInfo");

const searchInput = document.getElementById("searchInput");
const cleanBtn = document.getElementById("clearSearch");

// Solo botones que tienen data-status (evita incluir Favoritos)
const statusButtons = document.querySelectorAll(".filters .chip[data-status]");

const onlyFavorites = document.getElementById("favoritesBtn");

const isLoaded = document.getElementById("resultsInfo");


// ===============================
// LIMPIAR BUSCADOR
// ===============================

cleanBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchName = "";
  currentPage = 1;
  loadCharacters(currentPage);
});


// ===============================
// MOSTRAR SOLO FAVORITOS (LOCAL)
// ===============================

onlyFavorites.addEventListener("click", () => {

  // Filtra solo personajes cuyo ID esté en favoritos
  const onlyFavs = currentCharacters.filter(c => isFavorite(c.id));

  // Renderiza solo esos personajes
  renderCharacters(onlyFavs);
});


// ===============================
// LOCAL STORAGE - FAVORITOS
// ===============================

// Lee favoritos guardados
function loadFavorites() {
  try {
    const data = localStorage.getItem("rm_favorites");

    if (!data) return [];

    const parsed = JSON.parse(data);

    // Validación básica
    if (!Array.isArray(parsed)) return [];

    return parsed;

  } catch (error) {
    return [];
  }
}

// Guarda favoritos en localStorage
function saveFavorites() {
  const json = JSON.stringify(favorites);
  localStorage.setItem(Favorites_key, json);
}

// Verifica si un ID es favorito
function isFavorite(id) {
  return favorites.includes(id);
}

// Agrega favorito
function addFavorite(id) {
  if (!favorites.includes(id)) {
    favorites.push(id);
    saveFavorites();
  }
}

// Elimina favorito
function removeFavorite(id) {
  favorites = favorites.filter(favId => favId !== id);
  saveFavorites();
}


// ===============================
// CARGA PRINCIPAL DE PERSONAJES
// ===============================

async function loadCharacters(page) {
  try {

    // Muestra mensaje de carga
    showLoading(true);

    // Fetch a la API con filtros actuales
    const { characters, info } = await arrayCharacters(
      page,
      searchName,
      statusFilter,
    );

    // Actualiza indicador de página
    if (pageInfo) {
      pageInfo.textContent = `Página ${currentPage} de ${info.pages}`;
    }

    // Mensaje descriptivo según filtro activo
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

    // Guarda personajes actuales en memoria
    currentCharacters = characters;

    // Renderiza tarjetas
    renderCharacters(currentCharacters);

    // Activa/desactiva botones de paginado
    nextBtn.disabled = !info.next;
    prevBtn.disabled = !info.prev;

  } catch (error) {
    console.log(error);
    showLoading(false);
  }
}


// ===============================
// FETCH A LA API
// ===============================

async function arrayCharacters(page, searchName = "", statusFilter = "") {
  try {

    // Construcción dinámica de URL
    const url = new URL("https://rickandmortyapi.com/api/character");

    url.searchParams.set("page", page);

    if (searchName.trim())
      url.searchParams.set("name", searchName.trim());

    if (statusFilter)
      url.searchParams.set("status", statusFilter);

    const response = await fetch(url);

    // Manejo especial cuando no hay resultados
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

    // Retorno desestructurado
    return {
      characters: data.results,
      info: data.info
    };

  } catch (error) {
    console.log(error);
    throw error;
  }
}


// ===============================
// RENDER DE TARJETAS
// ===============================

function renderCharacters(characters) {

  const containerCards = document.getElementById("cardsGrid");
  if (!containerCards) return;

  containerCards.innerHTML = "";

  characters.forEach((c) => {

    const card = document.createElement("div");
    card.classList.add("card");

    // Imagen
    const img = document.createElement("img");
    img.classList.add("card__img");
    img.src = c.image;
    img.alt = c.name;

    // Botón favoritos
    const favoriteBtn = document.createElement("button");
    favoriteBtn.style.backgroundColor = "transparent";
    favoriteBtn.style.border = "0";
    favoriteBtn.style.cursor = "pointer";

    // Estado inicial estrella
    favoriteBtn.textContent = isFavorite(c.id) ? "⭐" : "❌";

    // Toggle favorito
    favoriteBtn.addEventListener("click", () => {

      if (isFavorite(c.id)) {
        removeFavorite(c.id);
      } else {
        addFavorite(c.id);
      }

      // Re-render para actualizar iconos
      renderCharacters(currentCharacters);
    });

    // Body
    const body = document.createElement("div");
    body.classList.add("card__body");

    const name = document.createElement("h3");
    name.classList.add("card__title");
    name.textContent = c.name;

    const badges = document.createElement("div");
    badges.classList.add("badges");

    // Status badge
    const status = document.createElement("span");
    status.classList.add("badge");
    status.textContent = c.status;

    const statusLower = c.status.toLowerCase();

    if (statusLower === "alive") status.classList.add("badge--alive");
    else if (statusLower === "dead") status.classList.add("badge--dead");
    else status.classList.add("badge--unknown");

    // Species badge
    const species = document.createElement("span");
    species.classList.add("badge");
    species.textContent = c.species;

    badges.append(status, species, favoriteBtn);
    body.append(name, badges);
    card.append(img, body);
    containerCards.appendChild(card);
  });
}


// ===============================
// EVENTOS UI
// ===============================

// Buscador por nombre
searchInput.addEventListener("input", () => {
  searchName = searchInput.value.trim();
  currentPage = 1;
  loadCharacters(currentPage);
});

// Paginado
nextBtn.addEventListener("click", () => {
  currentPage++;
  loadCharacters(currentPage);
});

prevBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  currentPage--;
  loadCharacters(currentPage);
});

// Carga inicial
document.addEventListener("DOMContentLoaded", () => {
  favorites = loadFavorites();
  loadCharacters(currentPage);
});

// Filtros por estado
statusButtons.forEach((btn) => {
  btn.addEventListener("click", () => {

    const status = btn.dataset.status;

    statusFilter = status === "all" ? "" : status;
    currentPage = 1;

    statusButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    loadCharacters(currentPage);
  });
});


// ===============================
// LOADING UI
// ===============================

function showLoading(isLoading) {

  const containerCards = document.getElementById("cardsGrid");
  if (!containerCards) return;

  containerCards.innerHTML =
    isLoading ? "<p>Cargando personajes...</p>" : "";
}
