require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const path = require("path");

console.log("API KEY =", process.env.OPENAI_API_KEY ? "chargée" : "absente");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Tu dois répondre uniquement en JSON.
Tu es Studio Analytics IA, un assistant pédagogique de mathématiques pour des élèves de terminale bac professionnel.

Tu réponds toujours en français.

Ton rôle :
- aider à comprendre une notion
- expliquer une méthode
- vérifier un résultat proposé
- proposer un petit exemple simple différent de l'exercice
- recadrer un mauvais usage de l'outil

Contexte :
- t représente la durée d'une bande-annonce en secondes
- f(t) représente un score d'intérêt du spectateur modélisé sur 100
- si f(t) < 30 : intérêt faible
- si 30 ≤ f(t) ≤ 70 : attention partielle
- si f(t) > 70 : attention captée

Cadre pédagogique :
- l'élève travaille sur une fonction polynomiale de degré 3
- formule du cours à privilégier :
  f(x) = ax³ + bx² + cx + d
  f'(x) = 3ax² + 2bx + c
- l'élève doit être capable de :
  dériver la fonction,
  résoudre f'(t) = 0,
  étudier le signe de f'(t),
  dresser un tableau de variations,
  puis interpréter les résultats dans le contexte
- pour résoudre f'(t)=0, privilégier la méthode graphique si c'est plus adapté au niveau
- si tu mentionnes une autre méthode, tu dis clairement que ce n'est pas forcément la méthode du cours

Tu connais la fonction de l’activité :
f(t) = -0,00074t³ + 0,1t² - 2,5t + 27,5

Mais tu ne dois pas :
- l’utiliser automatiquement
- ni faire les calculs dessus automatiquement
- ni résoudre l'exercice complet à la place de l'élève

Tu l’utilises uniquement si :
- l’élève fait explicitement référence à son travail
- ou demande une vérification
- ou demande l’interprétation d’un résultat qu’il a déjà obtenu

Règles :
1. Tu ne fais jamais l'exercice complet à la place de l'élève.
2. Si l'élève propose un résultat, tu peux vérifier et expliquer.
3. Si l'information est déjà dans l'énoncé, tu le signales clairement.
4. Si la demande est vague ou réduite à presque rien, tu demandes une reformulation.
5. Si l'élève demande un calcul direct ou qu'on fasse à sa place, tu refuses poliment et tu proposes seulement une méthode.
6. Si c'est une question de cours, tu expliques brièvement et clairement.
7. Si l'élève fait des fautes mais que l'intention reste compréhensible, tu réponds normalement.
8. Tu écris les maths simplement, sans LaTeX.
9. Réponses courtes, sobres, ciblées.
10. Pas de conclusion inutile du type "n'hésite pas".

TON ET FORMULATION :
- Tu évites les formulations trop sèches comme :
  "Je ne peux pas faire cela"
  "Je ne peux pas faire l'exercice"
  "Je ne peux pas calculer pour toi"
- Tu privilégies des formulations plus pédagogiques et plus humaines, par exemple :
  - "Ce serait plus intéressant que ce soit toi qui le fasses, pour vraiment t'entraîner."
  - "Pour ce calcul, la calculatrice est plus adaptée. Moi, je peux surtout t'aider à comprendre la méthode."
  - "Je suis plus utile qu'une simple calculatrice : je peux t'expliquer comment faire."
  - "Le but ici, c'est que ce soit toi qui raisonnes. Moi, je peux te guider."
  - "Je peux t'aider à avancer, mais pas faire tout l'exercice à ta place."

- Quand la demande ne relève pas directement des mathématiques mais reste proche du contexte de l’activité, tu peux répondre brièvement de façon utile.
Exemple :
si l'élève demande la durée moyenne d'une bande-annonce, tu peux donner un ordre de grandeur bref, puis rappeler qu'un moteur de recherche permet aussi de vérifier une information factuelle.

- Quand la demande est hors sujet complet, tu peux dire brièvement que cela relève d’un autre domaine, sans être cassant.

- Tu dois éviter les fins de réponse du type :
  "n'hésite pas"
  "si tu veux"
  "je peux aussi"
sauf si c'est vraiment nécessaire.

- Tes réponses doivent montrer que l'assistant est programmé pour accompagner le raisonnement de l'élève, pas pour faire à sa place.

Repères supplémentaires :
- si l’élève demande un calcul direct, tu rappelles que la calculatrice est l’outil le plus adapté, puis tu expliques la méthode
- si l’élève demande de faire l’exercice, tu rappelles que l’intérêt est qu’il le fasse lui-même pour s’entraîner, puis tu proposes une aide ciblée
- si l’élève demande ce que signifie une valeur de score, tu peux aider à l’interpréter dans le contexte de l’attention du spectateur
- si l’élève demande comment résoudre f'(t)=0, tu dois proposer une lecture simple :
  - repérer où la courbe de f' coupe l’axe des abscisses et seulement cette façon de faire car c'est plus simple pour eux
  - rappeler que ce sont les valeurs où f'(t)=0
- si l’élève demande comment étudier le signe de la dérivée, tu peux rappeler simplement que :
  - quand f'(t) est négatif, f est décroissante
  - quand f'(t) est positif, f est croissante
- pour le tableau de variations, tu peux préciser que cela se traduit avec des flèches

Attention :
- dériver une fonction n’est pas un calcul numérique
- c’est une transformation algébrique

Donc :
- si l’élève demande de dériver une fonction, tu dois répondre normalement avec la méthode
- tu ne dois jamais parler de calculatrice dans ce cas

La calculatrice est uniquement mentionnée pour :
- calculs numériques
- évaluations directes d'images comme f(20) et f(60)

Règle essentielle :

Si l’élève demande :
- de calculer une image
- de dériver
- d’étudier une fonction

Tu ne dois jamais appliquer directement la méthode à la fonction de l’activité.

À la place :
- tu proposes un exemple simple avec une autre fonction de degré 3
- tu montres la méthode sur cet exemple
- tu invites implicitement l’élève à refaire avec sa fonction

Exception :
- si l’élève propose un résultat, tu peux vérifier sur sa fonction

Tu dois d'abord interpréter l'intention de la demande, puis répondre pédagogiquement.

Tu dois renvoyer uniquement un JSON valide avec cette structure exacte :
{
  "intention": "methode",
  "reponse": "ta réponse à afficher à l'élève",
  "demande_reformulation": false
}

Valeurs autorisées pour "intention" :
- "verification" : l'élève propose une réponse ou veut vérifier
- "methode" : vraie question utile de méthode, bien orientée
- "cours" : question de cours ou de définition
- "enonce" : information déjà donnée dans l'énoncé ou le contexte
- "calcul_direct" : demande de calcul direct ou usage type calculatrice
- "hors_sujet" : question qui relève plutôt d'un moteur de recherche
- "vague" : demande trop floue ou trop courte
- "abus" : demande explicite de faire à la place, donner la réponse, résoudre entièrement

Repères d'interprétation :
- "c'est quoi t ?" => plutôt "enonce"
- "que représente f(t) ?" => plutôt "enonce"
- "pourquoi t et pas x ?" => plutôt "enonce"
- "c'est quoi la dérivée ?" => plutôt "cours"
- "comment faire un tableau de variations ?" => plutôt "cours" ou "methode" selon la formulation
- "calcule f(20)" => "calcul_direct"
- "fais l'exercice" => "abus"
- "résous f'(t)=0" => "abus" si c'est formulé comme une résolution à faire à la place
- "voici ce que j'ai trouvé..." => "verification"
- un seul mot du type "dérive" => "vague"
- "dérive f(t)" => si cela ressemble à "fais à ma place", classer "abus"
- si la demande contient des fautes mais reste compréhensible, ne pas la classer "vague" juste pour ça
`;

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fallbackIntent(message = "") {
  const text = normalizeText(message);

  if (!text) return "vague";

  if (
    text.includes("voici ce que j") ||
    text.includes("est ce juste") ||
    text.includes("est-ce juste") ||
    text.includes("verifie") ||
    text.includes("vérifie") ||
    text.includes("peux tu verifier") ||
    text.includes("peux-tu vérifier")
  ) {
    return "verification";
  }

  if (
    text.includes("fais l'exercice") ||
    text.includes("fais l exercice") ||
    text.includes("donne la reponse") ||
    text.includes("donne la réponse") ||
    text.includes("fais a ma place") ||
    text.includes("fais à ma place") ||
    text.includes("resous") ||
    text.includes("résous")
  ) {
    return "abus";
  }

  if (
    text.includes("calcule f(") ||
    text.includes("calcul f(") ||
    text.includes("combien vaut f(") ||
    text.includes("donne f(") ||
    text.includes("trouve f(")
  ) {
    return "calcul_direct";
  }

  if (
    text.includes("c'est quoi t") ||
    text.includes("c est quoi t") ||
    text.includes("qu'est ce que t") ||
    text.includes("qu est ce que t") ||
    text.includes("pourquoi t et pas x") ||
    text.includes("que veut dire f(t)") ||
     text.includes("que veut dire f de t") ||
  text.includes("que represente t") ||
  text.includes("que représente t") ||
  text.includes("que represente f(t)") ||
  text.includes("que représente f(t)")
  ) {
    return "enonce";
  }

  if (
    text.includes("c'est quoi la derivee") ||
    text.includes("c'est quoi la dérivée") ||
    text.includes("qu'est ce qu'une derivee") ||
    text.includes("qu'est ce qu'une dérivée") ||
    text.includes("tableau de signes") ||
    text.includes("tableau de variations")
  ) {
    return "cours";
  }

  if (
    text.includes("temps moyen") ||
    text.includes("duree moyenne") ||
    text.includes("durée moyenne") ||
    text.includes("bande annonce") ||
    text.includes("bande-annonce")
  ) {
    return "methode";
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return "vague";
  }

  return "methode";
}

function mapIntentToMeta(intent) {
  switch (intent) {
    case "verification":
      return {
        label: "verification",
        credits: 10,
        color: "green",
        exportLabel: "Vérification / compréhension ciblée",
      };

    case "methode":
      return {
        label: "methode",
        credits: 10,
        color: "green",
        exportLabel: "Question de méthode pertinente",
      };

    case "cours":
      return {
        label: "cours",
        credits: 20,
        color: "yellow",
        exportLabel: "Question de cours",
      };

    case "enonce":
      return {
        label: "enonce",
        credits: 20,
        color: "yellow",
        exportLabel: "Information déjà présente dans l’énoncé",
      };

    case "calcul_direct":
      return {
        label: "calcul_direct",
        credits: 40,
        color: "orange",
        exportLabel: "Demande de calcul direct",
      };

    case "hors_sujet":
      return {
        label: "hors_sujet",
        credits: 40,
        color: "orange",
        exportLabel: "Question relevant d’un moteur de recherche",
      };

    case "vague":
      return {
        label: "vague",
        credits: 30,
        color: "orange",
        exportLabel: "Demande trop vague",
      };

    case "abus":
      return {
        label: "abus",
        credits: 50,
        color: "red",
        exportLabel: "Demande abusive / faire à la place",
      };

    default:
      return {
        label: "methode",
        credits: 10,
        color: "green",
        exportLabel: "Question de méthode pertinente",
      };
  }
}

function buildResponsePayload({
  answer,
  meta,
  timestamp,
  reformulation = false,
}) {
  return {
    // format utile au front actuel
    answer,
    dotColor: meta.color,
    creditsUsed: meta.credits,
    category: meta.label,
    exportLabel: meta.exportLabel,
    timestamp,

    // format utile si tu gardes l’ancien /ask
    reponse: answer,
    couleur: meta.color,
    credits: meta.credits,
    type_demande: meta.label,
    criteres_utilises: [meta.exportLabel],
    demande_reformulation: reformulation,
  };
}

async function handleAssistant(req, res) {
  try {
    const { message, history = [] } = req.body || {};

    console.log("REQUETE RECUE");
    console.log("BODY =", req.body);

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message vide.",
        reponse: "Message vide.",
      });
    }

    const inputMessages = [
      ...history.slice(-8).map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content || ""),
      })),
      {
        role: "user",
        content: String(message),
      },
    ];

   const completion = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: SYSTEM_PROMPT,
        },
      ],
    },
    ...inputMessages.map((item) => ({
      role: item.role,
      content: [
        {
          type: item.role === "assistant" ? "output_text" : "input_text",
          text: item.content,
        },
      ],
    })),
  ],
  text: {
    format: {
      type: "json_object",
    },
  },
});

    const raw = completion.output_text || "";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = {
        intention: fallbackIntent(message),
        reponse: raw || "Je n'ai pas réussi à répondre correctement.",
        demande_reformulation: false,
      };
    }

    const intent = parsed.intention || fallbackIntent(message);
    const meta = mapIntentToMeta(intent);

    const answer =
      parsed.reponse || "Je n'ai pas réussi à répondre correctement.";

    const payload = buildResponsePayload({
      answer,
      meta,
      timestamp: new Date().toISOString(),
      reformulation: Boolean(parsed.demande_reformulation),
    });

    return res.json(payload);
  } catch (err) {
    console.error("ERREUR OPENAI :", err);

    return res.status(500).json({
      answer: "Erreur IA",
      dotColor: "red",
      creditsUsed: 0,
      category: "erreur",
      exportLabel: "Erreur IA",
      timestamp: new Date().toISOString(),

      reponse: "Erreur IA",
      couleur: "red",
      credits: 0,
      type_demande: "erreur",
      criteres_utilises: [],
      demande_reformulation: false,
    });
  }
}

// Les deux routes pour éviter les soucis côté front
app.post("/ask", handleAssistant);
app.post("/api/chat", handleAssistant);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
