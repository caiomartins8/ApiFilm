// token de autenticacao que libera o acesso aos dados
const API_TOKEN = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhNzczNTY3YmY3OGYxYTA1MDU2YzAzMWFkZTdiMDNlMiIsIm5iZiI6MTc2NDg2OTQ0Mi42NDUsInN1YiI6IjY5MzFjNTQyNjE5MWJkMGMyNTQxZTcwYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.orP3cDxt9xaBUnLaFeToQ_l3UhH9_HIOWswoB0CSdkI";

// links base pra carregar as imagens e acessar a api
const IMG_PATH = "https://image.tmdb.org/t/p/w300";
const IMG_BG = "https://image.tmdb.org/t/p/original";
const API_BASE = "https://api.themoviedb.org/3";

// dom
const searchInput = document.getElementById('searchInput');
const genreSelect = document.getElementById('genreSelect');
const btnSearch = document.querySelector('.btn-search');

const listRowAlta = document.querySelector('.list-row'); // lista de filmes em alta
const listRowTop10 = document.querySelector('.top10-row'); // lista top 10

const modalOverlay = document.getElementById('modalOverlay');
const modalFrame = document.getElementById('modalFrame');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

//fetch 
// essa funcao serve pra buscar dados em qualquer endereco url
async function getJSON(url) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: API_TOKEN // manda a chave pra ter permissao
        }
    };
    try {
        const response = await fetch(url, options); // vai la buscar
        return await response.json(); // devolve os dados prontos
    } catch (err) {
        console.error('deu erro na requisicao:', err); // avisa se der ruim
        return null;
    }
}

// roda assim que a pagina abre
async function loadHomePage() {
    //  busca os filmes populares
    const popularData = await getJSON(`${API_BASE}/movie/popular?language=pt-BR&page=1`);
    if (popularData && popularData.results) {
        // mostra eles na lista normal
        displayMovies(popularData.results, listRowAlta, false); 
        
        // pega o primeiro filme e joga no banner grandao
        setupHero(popularData.results[0]); 
    }

    //  busca os filmes mais bem avaliados pra fazer o top 10
    const topData = await getJSON(`${API_BASE}/movie/top_rated?language=pt-BR&page=1`);
    if (topData && topData.results) {
        // pega so os 10 primeiros e mostra com estilo de ranking
        displayMovies(topData.results.slice(0, 10), listRowTop10, true); 
    }
}

// recebe a lista de filmes onde vai colocar e se e top 10
function displayMovies(movies, container, isTop10) {
    container.innerHTML = ''; // limpa tudo antes de desenhar

    movies.forEach((movie, index) => {
        const div = document.createElement('div');
        div.classList.add('movie-item'); // coloca a classe do card
        if (isTop10) div.classList.add('rank-item'); // se for top 10 ganha estilo extra

        // monta o html do card
        let htmlContent = '';
        
        // se for top 10 coloca o numerozao do lado
        if (isTop10) {
            htmlContent += `<span class="rank-number">${index + 1}</span>`;
        }

        // se nao tiver poster usa uma imagem cinza tapa buraco
        const imageSrc = movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/300x450/333/fff?text=sem+imagem';

        htmlContent += `<img src="${imageSrc}" alt="${movie.title}">`;
        
        div.innerHTML = htmlContent;

        // quando clicar no card abre os detalhes
        div.addEventListener('click', () => openMovieDetails(movie));

        container.appendChild(div); // joga o card na tela
    });
}

// preenche o destaque com o filme principal
function setupHero(movie) {
    const hero = document.querySelector('.hero');
    const title = document.querySelector('.hero-title');
    const desc = document.querySelector('.hero-description');

    // se tiver imagem de fundo coloca ela
    if (movie.backdrop_path) {
        hero.style.backgroundImage = `url('${IMG_BG + movie.backdrop_path}')`;
    }
    title.innerText = movie.title;
    desc.innerText = movie.overview || "sem descricao disponivel."; // texto padrao se nao tiver sinopse
}

// --- logica do botao de busca ---
btnSearch.addEventListener('click', async () => {
    const query = searchInput.value; // pega o texto digitado
    const genre = genreSelect.value; // pega o genero escolhido
    
    let url = '';

    if (query) {
        // se digitou algo busca por nome
        url = `${API_BASE}/search/movie?query=${query}&language=pt-BR&include_adult=false`;
    } else if (genre) {
        // se escolheu genero busca por categoria
        url = `${API_BASE}/discover/movie?with_genres=${genre}&language=pt-BR&sort_by=popularity.desc`;
    } else {
        alert("digite um nome ou escolha um genero!");
        return; // para tudo se nao tiver nada
    }

   const data = await getJSON(url);
    if (data && data.results) {
        document.querySelector('h3').innerText = "resultados da busca";
        
        // uma variável que pode receber a lista original OU a filtrada
        let listaFinal = data.results;

        //  Se tiver um gênero selecionado, aplicamos filtro 
        if (genre) {
             listaFinal = data.results.filter(movie => {
                // O parseInt é importante porque o 'genre' vem da api como texto ("28")
                // e a lista do filme é numero ([28, 12])
                return movie.genre_ids.includes(parseInt(genre));
            });
        }
        
        //  a 'listaFinal' (já filtrada) para a função que desenha na tela
        displayMovies(listaFinal, listRowAlta, false); 
        

        window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' });
    }
});

// modal busca trailer e abre 
async function openMovieDetails(movie) {
    //  preenche titulo e sinopse
    modalTitle.innerText = movie.title;
    modalDesc.innerText = movie.overview || "sinopse nao disponivel.";
    
    // busca os videos na api em portugues
    const videosData = await getJSON(`${API_BASE}/movie/${movie.id}/videos?language=pt-BR`);
    let videoKey = null;

    // tenta achar um trailer do youtube
    if (videosData && videosData.results.length > 0) {
        const trailer = videosData.results.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
        if (trailer) videoKey = trailer.key;
    }

    // se nao achou em portugues tenta em ingles
    if (!videoKey) {
        const videosEn = await getJSON(`${API_BASE}/movie/${movie.id}/videos?language=en-US`);
        if (videosEn && videosEn.results.length > 0) {
            const trailerEn = videosEn.results.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
            if (trailerEn) videoKey = trailerEn.key;
        }
    }

    // se achou video monta o player do youtube
    if (videoKey) {
        modalFrame.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&modestbranding=1&rel=0`;
        modalFrame.parentElement.style.display = 'block'; // mostra o video
    } else {
        modalFrame.src = '';
        modalFrame.parentElement.style.display = 'none'; // esconde se nao tiver video
    }

    // mostra a janelinha na tela
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // trava a rolagem do fundo
}

// funcao pra fechar o modal
function closeModal() {
    modalOverlay.classList.remove('active');
    modalFrame.src = ''; // para o som do video
    document.body.style.overflow = 'auto'; // destrava a rolagem
}

// fecha se clicar no fundo escuro
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// fecha se clicar no botao x
document.querySelector('.close-btn').addEventListener('click', closeModal);

// header preto ao rolar
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('black-bg'); // fica preto se rolar
    else header.classList.remove('black-bg'); // fica transparente no topo
});

// inicia tudo
loadHomePage();