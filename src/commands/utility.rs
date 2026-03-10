use crate::{Context, Error};
use poise::serenity_prelude as serenity;
use serenity::Mentionable;

/// ¡Responde con Pong!
#[poise::command(slash_command)]
pub async fn ping(ctx: Context<'_>) -> Result<(), Error> {
    ctx.say("🏓 Pong!").await?;
    Ok(())
}

#[derive(poise::ChoiceParameter)]
pub enum Categoria {
    #[name = "frontend"] Frontend,
    #[name = "backend"] Backend,
    #[name = "fullstack"] Fullstack,
    #[name = "bot"] Bot,
    #[name = "api"] Api,
    #[name = "cli"] Cli,
    #[name = "ai"] Ai,
    #[name = "web"] Web,
    #[name = "tools"] Tools,
    #[name = "testing"] Testing,
    #[name = "cloud"] Cloud,
    #[name = "security"] Security,
    #[name = "devops"] Devops,
    #[name = "mobile"] Mobile,
    #[name = "games"] Games,
}

impl Categoria {
    fn as_str(&self) -> &'static str {
        match self {
            Categoria::Frontend => "frontend",
            Categoria::Backend => "backend",
            Categoria::Fullstack => "fullstack",
            Categoria::Bot => "bot",
            Categoria::Api => "api",
            Categoria::Cli => "cli",
            Categoria::Ai => "ai",
            Categoria::Web => "web",
            Categoria::Tools => "tools",
            Categoria::Testing => "testing",
            Categoria::Cloud => "cloud",
            Categoria::Security => "security",
            Categoria::Devops => "devops",
            Categoria::Mobile => "mobile",
            Categoria::Games => "games",
        }
    }
}

/// ¡Añade un repositorio a la lista!
#[poise::command(slash_command)]
pub async fn repoadd(
    ctx: Context<'_>,
    #[description = "La url del repositorio"] url: String,
    #[description = "Categoría para el repositorio"] categoria: Categoria,
) -> Result<(), Error> {
    if !url.starts_with("https://github.com") {
        ctx.say("❌ URL inválida.").await?;
        return Ok(());
    }

    let db = &ctx.data().db;
    
    // Check if exists
    let exists: Option<(i32,)> = sqlx::query_as("SELECT id FROM repos WHERE url = ?")
        .bind(&url)
        .fetch_optional(db)
        .await?;

    if exists.is_some() {
        ctx.say("⚠️ Ese repo ya está guardado.").await?;
        return Ok(());
    }

    let cat_str = categoria.as_str();
    let row: (i64,) = sqlx::query_as("INSERT INTO repos (url, categoria) VALUES (?, ?) RETURNING id")
        .bind(&url)
        .bind(cat_str)
        .fetch_one(db)
        .await?;

    ctx.say(format!(
        "✅ Repositorio guardado con ID `{}` en **{}**:\n{}",
        row.0, cat_str, url
    )).await?;

    Ok(())
}

/// ¡Muestra una lista de repositorios guardados!
#[poise::command(slash_command)]
pub async fn repos(
    ctx: Context<'_>,
    #[description = "Filtra por categoría"] categoria: Option<Categoria>,
    #[description = "Busca un repositorio por ID"] id: Option<i32>,
) -> Result<(), Error> {
    let db = &ctx.data().db;

    if let Some(repo_id) = id {
        let repo: Option<(i32, String, String)> = sqlx::query_as("SELECT id, url, categoria FROM repos WHERE id = ?")
            .bind(repo_id)
            .fetch_optional(db)
            .await?;

        if let Some(r) = repo {
            ctx.say(format!("🔍 **Repositorio encontrado:**\n`{}.` [{}] {}", r.0, r.2, r.1)).await?;
        } else {
            ctx.say(format!("❌ No se encontró un repositorio con ID `{}`.", repo_id)).await?;
        }
        return Ok(());
    }

    let repos: Vec<(i32, String, String)> = if let Some(cat) = categoria {
        let cat_str = cat.as_str();
        sqlx::query_as("SELECT id, url, categoria FROM repos WHERE categoria = ?")
            .bind(cat_str)
            .fetch_all(db)
            .await?
    } else {
        sqlx::query_as("SELECT id, url, categoria FROM repos")
            .fetch_all(db)
            .await?
    };

    if repos.is_empty() {
        ctx.say("📭 No hay repositorios guardados aún.").await?;
        return Ok(());
    }

    let mut response = "📚 **Repositorios guardados**:\n\n".to_string();
    for r in repos {
        response.push_str(&format!("`{}.` [{}] {}\n", r.0, r.2, r.1));
    }

    ctx.say(response).await?;

    Ok(())
}

/// ¡Elimina un repositorio de la lista!
#[poise::command(slash_command)]
pub async fn repodelete(
    ctx: Context<'_>,
    #[description = "El ID del repositorio a eliminar"] id: i32,
) -> Result<(), Error> {
    let db = &ctx.data().db;

    let result = sqlx::query("DELETE FROM repos WHERE id = ?")
        .bind(id)
        .execute(db)
        .await?;

    if result.rows_affected() > 0 {
        ctx.say(format!("✅ Repositorio con ID `{}` eliminado.", id)).await?;
    } else {
        ctx.say(format!("❌ No se encontró un repositorio con ID `{}`.", id)).await?;
    }

    Ok(())
}

/// Muestra el avatar del usuario.
#[poise::command(slash_command)]
pub async fn avatar(
    ctx: Context<'_>,
    #[description = "Usuario del que quieres mostrar su avatar"]
    user: Option<serenity::User>,
    #[description = "¿Mostrar el avatar del servidor?"]
    guild: Option<bool>,
) -> Result<(), Error> {
    let user = user.as_ref().unwrap_or(ctx.author());
    let show_guild = guild.unwrap_or(false);

    let avatar_url = if show_guild {
        if let Some(guild_id) = ctx.guild_id() {
            let member = guild_id.member(&ctx.serenity_context(), user.id).await?;
            member.face()
        } else {
            user.face()
        }
    } else {
        user.face()
    };

    ctx.say(avatar_url).await?;
    Ok(())
}

/// Cambia o resetea el apodo de un miembro.
#[poise::command(
    slash_command,
    required_permissions = "MANAGE_NICKNAMES",
    default_member_permissions = "MANAGE_NICKNAMES"
)]
pub async fn nickname(
    ctx: Context<'_>,
    #[description = "El miembro cuyo apodo quieres cambiar."]
    mut member: serenity::Member,
    #[description = "El nuevo apodo. Déjalo en blanco para resetearlo."]
    #[max = 32]
    nuevo_apodo: Option<String>,
) -> Result<(), Error> {
    let old_nickname = member.display_name().to_string();
    
    if let Err(e) = member.edit(&ctx.serenity_context(), serenity::EditMember::new().nickname(nuevo_apodo.as_deref().unwrap_or(""))).await {
        ctx.say(format!("❌ Hubo un error al intentar cambiar el apodo: {}", e)).await?;
    } else {
        let description = match nuevo_apodo {
            Some(nick) => format!("El apodo de **{}** ha sido cambiado a **{}**.", old_nickname, nick),
            None => format!("El apodo de **{}** ha sido reseteado.", old_nickname),
        };

        let embed = serenity::CreateEmbed::new()
            .color(0x7289da)
            .title("📝 Apodo Actualizado")
            .description(description)
            .field("Usuario", member.user.mention().to_string(), true)
            .field("Moderador", ctx.author().mention().to_string(), true)
            .timestamp(serenity::Timestamp::now());

        ctx.send(poise::CreateReply::default().embed(embed)).await?;
    }

    Ok(())
}

/// Crea una encuesta simple en el canal.
#[poise::command(slash_command)]
pub async fn poll(
    ctx: Context<'_>,
    #[description = "La pregunta que quieres hacer en la encuesta."]
    pregunta: String,
) -> Result<(), Error> {
    let embed = serenity::CreateEmbed::new()
        .color(0x5865f2)
        .title(format!("📊 Encuesta: {}", pregunta))
        .description("Reacciona con 👍 o 👎 para votar.")
        .timestamp(serenity::Timestamp::now())
        .footer(serenity::CreateEmbedFooter::new(format!("Encuesta iniciada por {}", ctx.author().name)).icon_url(ctx.author().face()));

    let reply = ctx.send(poise::CreateReply::default().embed(embed)).await?;
    let message = reply.message().await?;
    
    message.react(&ctx.serenity_context(), '👍').await?;
    message.react(&ctx.serenity_context(), '👎').await?;

    Ok(())
}

/// Muestra información y estadísticas detalladas sobre este servidor.
#[poise::command(slash_command)]
pub async fn server_info(ctx: Context<'_>) -> Result<(), Error> {
    let guild = ctx.guild().ok_or("Not in a guild")?.clone();
    
    let owner_tag = serenity::UserId::new(guild.owner_id.into()).to_user(&ctx.serenity_context()).await?.tag();
    
    let text_channels = guild.channels.values().filter(|c| c.kind == serenity::ChannelType::Text).count();
    let voice_channels = guild.channels.values().filter(|c| c.kind == serenity::ChannelType::Voice).count();

    let embed = serenity::CreateEmbed::new()
        .color(0x5865f2)
        .title(format!("Información de {}", guild.name))
        .thumbnail(guild.icon_url().unwrap_or_default())
        .field("👑 Propietario", owner_tag, true)
        .field("🆔 ID del Servidor", format!("`{}`", guild.id), true)
        .field("📅 Creación", format!("<t:{}:F>", guild.id.created_at().unix_timestamp()), false)
        .field(format!("👥 Miembros ({})", guild.member_count), format!("Total miembros: **{}**", guild.member_count), true)
        .field(format!("💬 Canales ({})", guild.channels.len()), format!("**{}** Texto | **{}** Voz", text_channels, voice_channels), true)
        .field("🎭 Roles", guild.roles.len().to_string(), true)
        .field("✨ Nivel de Verificación", format!("{:?}", guild.verification_level), true)
        .field("🚀 Boosts", format!("Nivel **{:?}** con **{:?}** boosts", guild.premium_tier, guild.premium_subscription_count), true)
        .timestamp(serenity::Timestamp::now());

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}
