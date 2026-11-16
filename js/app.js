// Café Mobile: funções do cardápio, câmera, galeria e PWA.

const filtros = document.querySelectorAll(".filtro");
const cards = document.querySelectorAll(".card");

filtros.forEach((botao) => {
  botao.addEventListener("click", () => {
    filtros.forEach((item) => item.classList.remove("ativo"));
    botao.classList.add("ativo");

    const categoria = botao.dataset.categoria;
    cards.forEach((card) => {
      card.hidden = categoria !== "Todos" && card.dataset.categoria !== categoria;
    });
  });
});

// Ação demonstrativa dos botões de adicionar.
document.querySelectorAll(".btn-adicionar").forEach((botao) => {
  botao.addEventListener("click", () => {
    const nome = botao.closest(".card").querySelector("h3").textContent;
    alert(`${nome} foi adicionado ao seu pedido!`);
  });
});

// Elementos da câmera e galeria.
const video = document.getElementById("video-camera");
const canvas = document.getElementById("canvas-foto");
const painelCamera = document.getElementById("painel-camera");
const mensagem = document.getElementById("mensagem-camera");
const galeria = document.getElementById("galeria-fotos");
const contador = document.getElementById("contador-fotos");

let fluxoCamera = null;
let fotos = JSON.parse(localStorage.getItem("cafeMobileFotos") || "[]");

function atualizarGaleria() {
  contador.textContent = `(${fotos.length})`;

  if (fotos.length === 0) {
    galeria.innerHTML = '<p class="galeria-vazia">Ainda não há fotos. Seja o primeiro a registrar um momento!</p>';
    return;
  }

  galeria.innerHTML = "";
  fotos.forEach((foto) => {
    const card = document.createElement("article");
    card.className = "foto-card";

    const imagem = document.createElement("img");
    imagem.src = foto.imagem;
    imagem.alt = foto.legenda || "Foto da galeria";

    const info = document.createElement("div");
    info.className = "foto-info";

    const legenda = document.createElement("strong");
    legenda.textContent = foto.legenda || "Foto sem legenda";

    const data = document.createElement("small");
    data.textContent = new Date(foto.data).toLocaleString("pt-BR");

    info.append(legenda, data);
    card.append(imagem, info);
    galeria.append(card);
  });
}

async function abrirCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mensagem.textContent = "Seu navegador não permite acessar a câmera neste endereço. Use HTTPS ou localhost e um navegador atualizado.";
    return;
  }

  try {
    fluxoCamera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = fluxoCamera;
    painelCamera.hidden = false;
    mensagem.textContent = "Câmera liberada! Enquadre a foto e toque em Tirar foto.";
  } catch (erro) {
    if (erro.name === "NotAllowedError" || erro.name === "PermissionDeniedError") {
      mensagem.textContent = "Permissão da câmera negada. Para liberar novamente, toque no cadeado ou ícone de permissões ao lado do endereço do site, abra as permissões, altere Câmera para Permitir e recarregue a página.";
    } else {
      mensagem.textContent = "Não foi possível abrir a câmera. Verifique as permissões do navegador e se outro aplicativo está usando a câmera.";
    }
  }
}

function fecharCamera() {
  if (fluxoCamera) {
    fluxoCamera.getTracks().forEach((faixa) => faixa.stop());
  }
  fluxoCamera = null;
  video.srcObject = null;
  painelCamera.hidden = true;
}

function tirarFoto() {
  if (!video.videoWidth) {
    mensagem.textContent = "A câmera ainda está iniciando. Aguarde um instante e tente novamente.";
    return;
  }

  // Dia 4: largura máxima de 1080 pixels e qualidade JPEG 0.95.
  const largura = Math.min(1080, video.videoWidth);
  const altura = Math.round(video.videoHeight * (largura / video.videoWidth));

  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext("2d").drawImage(video, 0, 0, largura, altura);

  const imagem = canvas.toDataURL("image/jpeg", 0.95);
  const legendaDigitada = prompt("Legenda da foto:");

  if (legendaDigitada === null) {
    mensagem.textContent = "Operação cancelada. A foto não foi salva.";
    return;
  }

  const novaFoto = {
    imagem,
    legenda: legendaDigitada.trim() || "Foto sem legenda",
    data: new Date().toISOString()
  };

  fotos.unshift(novaFoto);

  try {
    localStorage.setItem("cafeMobileFotos", JSON.stringify(fotos));
    atualizarGaleria();
    mensagem.textContent = "Foto salva na galeria com sucesso!";
  } catch (erro) {
    fotos.shift();
    mensagem.textContent = "Não foi possível salvar. O armazenamento do navegador pode estar cheio. Apague algumas fotos e tente novamente.";
  }
}

document.getElementById("btn-abrir-camera").addEventListener("click", abrirCamera);
document.getElementById("btn-fechar-camera").addEventListener("click", fecharCamera);
document.getElementById("btn-tirar-foto").addEventListener("click", tirarFoto);

document.getElementById("btn-limpar-galeria").addEventListener("click", () => {
  if (confirm("Deseja apagar todas as fotos da galeria?")) {
    fotos = [];
    localStorage.removeItem("cafeMobileFotos");
    atualizarGaleria();
    mensagem.textContent = "Galeria limpa.";
  }
});

atualizarGaleria();

// Indicador de conexão.
const statusConexao = document.getElementById("status-conexao");
function atualizarConexao() {
  statusConexao.textContent = navigator.onLine ? "● Online" : "● Offline";
}
window.addEventListener("online", atualizarConexao);
window.addEventListener("offline", atualizarConexao);
atualizarConexao();

// Dia 5: registra o Service Worker para recursos PWA.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(() => {
        mensagem.textContent = "O modo offline não foi ativado. Verifique se o site está em HTTPS ou localhost.";
      });
  });
}