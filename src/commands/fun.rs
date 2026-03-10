use crate::{Context, Error};
use serde::Deserialize;
use poise::serenity_prelude as serenity;
use rand::Rng;

#[derive(Deserialize)]
struct JokeResponse {
    joke: Option<String>,
    error: bool,
}

/// Te cuenta un chiste de programación
#[poise::command(slash_command)]
pub async fn joke(ctx: Context<'_>) -> Result<(), Error> {
    let response = reqwest::get("https://v2.jokeapi.dev/joke/Programming?lang=en&type=single")
        .await?
        .json::<JokeResponse>()
        .await?;

    if response.error {
        ctx.say("No pude conseguir un chiste ahora, intenta luego.").await?;
    } else {
        let joke = response.joke.unwrap_or_else(|| "No encontré chiste esta vez 😕".to_string());
        ctx.say(joke).await?;
    }

    Ok(())
}

/// Pregunta a la bola 8 mágica
#[poise::command(slash_command)]
pub async fn ball8(
    ctx: Context<'_>,
    #[description = "Tu pregunta"] pregunta: String,
) -> Result<(), Error> {
    let respuestas = [
        "Es seguro.",
        "Sin duda.",
        "Puedes confiar en ello.",
        "Sí, definitivamente.",
        "Según veo, sí.",
        "Muy probable.",
        "La perspectiva es buena.",
        "Las señales apuntan a que sí.",
        "Respuesta confusa, intenta de nuevo.",
        "Pregunta más tarde.",
        "Mejor no decirte ahora.",
        "No puedo predecir ahora.",
        "No cuentes con ello.",
        "Mi respuesta es no.",
        "Mis fuentes dicen que no.",
        "La perspectiva no es buena.",
        "Muy dudoso.",
    ];

    let respuesta = {
        let mut rng = rand::thread_rng();
        respuestas[rng.gen_range(0..respuestas.len())]
    };

    ctx.say(format!("🎱 Preguntaste: **{}**\nRespuesta: **{}**", pregunta, respuesta)).await?;
    Ok(())
}

/// Tira un dado de 6 caras
#[poise::command(slash_command)]
pub async fn dice(ctx: Context<'_>) -> Result<(), Error> {
    let roll = {
        let mut rng = rand::thread_rng();
        rng.gen_range(1..=6)
    };
    ctx.say(format!("🎲 Has sacado un **{}**", roll)).await?;
    Ok(())
}

#[derive(Deserialize)]
struct MemeResponse {
    title: String,
    url: String,
    #[serde(rename = "postLink")]
    post_link: String,
    author: String,
}

/// Te muestra un meme de programación 😎
#[poise::command(slash_command)]
pub async fn meme(ctx: Context<'_>) -> Result<(), Error> {
    ctx.defer().await?;

    let response = reqwest::get("https://meme-api.com/gimme/ProgrammerHumor")
        .await?
        .json::<MemeResponse>()
        .await?;

    let color = {
        let mut rng = rand::thread_rng();
        serenity::Color::from_rgb(rng.gen(), rng.gen(), rng.gen())
    };

    let embed = serenity::CreateEmbed::new()
        .title(&response.title)
        .url(&response.post_link)
        .image(&response.url)
        .color(color)
        .footer(serenity::CreateEmbedFooter::new(format!("Autor: u/{}", response.author)));

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}
