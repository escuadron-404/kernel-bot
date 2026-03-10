mod commands;

use poise::serenity_prelude as serenity;
use sqlx::SqlitePool;
use tracing::{info, error};
use std::env;

pub struct Data {
    pub db: SqlitePool,
    pub offers_channel_id: String,
}

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Context<'a> = poise::Context<'a, Data, Error>;

const COFFEE_KEYWORDS: &str = r"\b(?:cafecito|cafetera|cafes|café|iced coffee|flat white|cold brew|drip coffee|turkish coffee|french press|clever dripper|coffee maker|coffee grinder|coffee beans|coffee grounds|coffee break|coffee shop|coffee pot|pour over|aeropress|cappuccino|percolator|americano|macchiato|cafetière|espresso|cortado|caffeine|affogato|ristretto|frappe|siphon|chemex|barista|arabica|robusta|greca|geisha|decaf|latte|mocha|lungo|kaffe|moka|café|cafe|coffee|beans|bean|brew|roast|kalua)\b";

const JOB_OFFER_FORMAT: &str = r#"
```
:sparkles::briefcase: OFERTA DE EMPLEO :briefcase::sparkles:

**[1] :dart: Puesto:** [Título del Puesto]
**[2] :office: Empresa/Cliente:** [Nombre de Empresa o "Individual"]
**[3] :handshake: Contratación:** [Tiempo Completo / Medio Tiempo / Contrato / Freelance / Gig]
**[4] :round_pushpin: Ubicación:** [Remoto / Ciudad, País / Presencial / Híbrido]
**[5] :alarm_clock: Zona Horaria Requerido:** [Ej. PST / EST / GMT+1 / Flexible]

**[6] :pencil: Descripción:**
[Descripción breve del rol o proyecto. ¿Qué problema resuelve? Objetivos principales. Máx. 2-4 frases.]

**[7] :white_check_mark: Responsabilidades:**
- [Tareas específicas a realizar.]
- [Claro y conciso.]
- [Usa viñetas.]
- [Ej. Gestionar Discord, Desarrollar web, Crear gráficos]

**[8] :brain: Habilidades/Requisitos:**
- [Habilidades, experiencia o cualificaciones obligatorias.]
- [Ej. X años con Y, dominio Z, buena comunicación.]

**[9] :moneybag: Compensación:**
[Ej. $X/hora, $Y tarifa fija, $Z/mes, Salario+Equity, Negociable (rango).]

**[10] :calendar_spiral: Fecha Límite:**
[Fecha, Hora, Zona Horaria (ej. 2024-12-31 17:00 EST) o "Abierta"]

**[11] :e_mail: Postulación:**
[Instrucciones claras: "DM @usuario", "Email a correo@ejemplo.com", "Link: https://tu.link"]
```
"#;

fn is_offer(content: &str) -> bool {
    let required_header = ":sparkles::briefcase: OFERTA DE EMPLEO :briefcase::sparkles:";
    let section_headers = [
        "**[1] :dart: Puesto:**",
        "**[2] :office: Empresa/Cliente:**",
        "**[3] :handshake: Contratación:**",
        "**[4] :round_pushpin: Ubicación:**",
        "**[5] :alarm_clock: Zona Horaria Requerido:**",
        "**[6] :pencil: Descripción:**",
        "**[7] :white_check_mark: Responsabilidades:**",
        "**[8] :brain: Habilidades/Requisitos:**",
        "**[9] :moneybag: Compensación:**",
        "**[10] :calendar_spiral: Fecha Límite:**",
        "**[11] :e_mail: Postulación:**",
    ];

    if !content.contains(required_header) {
        return false;
    }

    for header in section_headers {
        if !content.contains(header) {
            return false;
        }
    }

    true
}

async fn event_handler(
    ctx: &serenity::Context,
    event: &serenity::FullEvent,
    _framework: poise::FrameworkContext<'_, Data, Error>,
    data: &Data,
) -> Result<(), Error> {
    match event {
        serenity::FullEvent::Ready { data_about_bot } => {
            info!("{} is connected!", data_about_bot.user.name);
        }
        serenity::FullEvent::Message { new_message } => {
            if new_message.author.bot {
                return Ok(());
            }

            // Coffee keywords check
            let re = regex::RegexBuilder::new(COFFEE_KEYWORDS)
                .case_insensitive(true)
                .build()?;
            if re.is_match(&new_message.content) {
                let _ = new_message.channel_id.say(&ctx.http, "`HTTP/1.1` **418** I'm a teapot").await;
            }

            // Job offers channel logic
            if new_message.channel_id.to_string() == data.offers_channel_id {
                let is_thread_starter = new_message.thread.is_some() || new_message.kind == serenity::MessageType::ThreadCreated;
                let valid_offer = is_offer(&new_message.content);

                if !is_thread_starter && !valid_offer {
                    let author_id = new_message.author.id;
                    if let Err(e) = new_message.delete(&ctx.http).await {
                        error!("Error deleting non-offer message: {:?}", e);
                    } else {
                        let rejection_content = format!(
                            "¡Hola <@{}>! Tu mensaje ha sido eliminado en el canal de ofertas.\n\nPara publicar una oferta de empleo, debes iniciar un nuevo hilo (**¡IMPORTANTE! Si el mensaje que envías no inicia un hilo, será eliminado.**) y seguir estrictamente el formato:\n\n{}",
                            author_id, JOB_OFFER_FORMAT
                        );
                        let _ = new_message.channel_id.say(&ctx.http, rejection_content).await;
                    }
                }
            }
        }
        _ => {}
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let app_env = env::var("APP_ENV").unwrap_or_else(|_| "test".into());
    let env_file = format!(".env.{}", app_env);
    
    info!("Loading environment: {}", app_env);
    dotenvy::from_filename(&env_file).ok();
    // Fallback to default .env if specific one fails
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt::init();

    let token = env::var("DISCORD_TOKEN").expect("Expected DISCORD_TOKEN in environment");
    let offers_channel_id = env::var("OFFERS_CHANNEL_ID").unwrap_or_default();
    let guild_id = env::var("GUILD_ID").ok().map(|id| serenity::GuildId::new(id.parse().expect("Invalid GUILD_ID")));

    // Connect to SQLite
    let pool = SqlitePool::connect("sqlite:sqlite.db?mode=rwc").await?;

    // Create tables if they don't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            categoria TEXT NOT NULL
        )"
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )"
    )
    .execute(&pool)
    .await?;

    let intents = serenity::GatewayIntents::GUILD_MESSAGES
        | serenity::GatewayIntents::DIRECT_MESSAGES
        | serenity::GatewayIntents::MESSAGE_CONTENT
        | serenity::GatewayIntents::GUILD_MEMBERS
        | serenity::GatewayIntents::GUILDS;

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                commands::fun::joke(),
                commands::fun::ball8(),
                commands::fun::dice(),
                commands::fun::meme(),
                commands::utility::ping(),
                commands::utility::repoadd(),
                commands::utility::repos(),
                commands::utility::repodelete(),
                commands::utility::avatar(),
                commands::utility::nickname(),
                commands::utility::poll(),
                commands::utility::server_info(),
                commands::moderation::ban(),
                commands::moderation::kick(),
                commands::moderation::timeout(),
                commands::moderation::unban(),
                commands::moderation::clear(),
                commands::moderation::slowmode(),
                commands::moderation::lock(),
                commands::moderation::remove_timeout(),
                commands::moderation::user_info(),
                commands::moderation::warn(),
                commands::moderation::warnings(),
                commands::git::profile(),
            ],
            event_handler: |ctx, event, framework, data| {
                Box::pin(event_handler(ctx, event, framework, data))
            },
            ..Default::default()
        })
        .setup(move |ctx, _ready, framework| {
            Box::pin(async move {
                if let Some(guild) = guild_id {
                    info!("Registering commands for guild: {}", guild);
                    poise::builtins::register_in_guild(ctx, &framework.options().commands, guild).await?;
                } else {
                    info!("Registering commands globally");
                    poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                }
                Ok(Data { db: pool, offers_channel_id })
            })
        })
        .build();

    let mut client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .await?;

    client.start().await?;
    Ok(())
}
