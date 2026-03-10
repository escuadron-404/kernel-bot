use crate::{Context, Error};
use poise::serenity_prelude as serenity;

/// Banea a un miembro del servidor.
#[poise::command(
    slash_command,
    required_permissions = "BAN_MEMBERS",
    default_member_permissions = "BAN_MEMBERS"
)]
pub async fn ban(
    ctx: Context<'_>,
    #[description = "El miembro que quieres banear."] user: serenity::Member,
    #[description = "La razón para el baneo."] reason: Option<String>,
) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Must be in a guild")?;
    let reason = reason.unwrap_or_else(|| "No se proporcionó una razón.".to_string());

    if user.user.id == ctx.author().id {
        ctx.say("No puedes banearte a ti mismo.").await?;
        return Ok(());
    }

    let ban_embed = serenity::CreateEmbed::new()
        .color(0xff0000)
        .title("Usuario Baneado")
        .field("Usuario", &user.user.tag(), true)
        .field("Moderador", &ctx.author().tag(), true)
        .field("Razón", &reason, false)
        .timestamp(serenity::Timestamp::now());

    // Try to send DM
    let _ = user
        .user
        .dm(
            &ctx.serenity_context(),
            serenity::CreateMessage::new().content(format!(
                "Has sido baneado del servidor por la siguiente razón: {}",
                reason
            )),
        )
        .await;

    if let Err(e) = guild_id.ban_with_reason(&ctx.serenity_context(), user.user.id, 0, &reason).await {
        ctx.say(format!("No puedo banear a este usuario. Error: {}", e)).await?;
    } else {
        ctx.send(poise::CreateReply::default().embed(ban_embed)).await?;
    }

    Ok(())
}

/// Expulsa a un miembro del servidor.
#[poise::command(
    slash_command,
    required_permissions = "KICK_MEMBERS",
    default_member_permissions = "KICK_MEMBERS"
)]
pub async fn kick(
    ctx: Context<'_>,
    #[description = "El miembro que quieres expulsar."] user: serenity::Member,
    #[description = "La razón para la expulsión."] reason: Option<String>,
) -> Result<(), Error> {
    let reason = reason.unwrap_or_else(|| "No se proporcionó una razón.".to_string());

    if user.user.id == ctx.author().id {
        ctx.say("No puedes expulsarte a ti mismo.").await?;
        return Ok(());
    }

    let kick_embed = serenity::CreateEmbed::new()
        .color(0xff8c00)
        .title("Usuario Expulsado")
        .field("Usuario", &user.user.tag(), true)
        .field("Moderador", &ctx.author().tag(), true)
        .field("Razón", &reason, false)
        .timestamp(serenity::Timestamp::now());

    // Try to send DM
    let _ = user
        .user
        .dm(
            &ctx.serenity_context(),
            serenity::CreateMessage::new().content(format!(
                "Has sido expulsado del servidor por la siguiente razón: {}",
                reason
            )),
        )
        .await;

    if let Err(e) = user.kick_with_reason(&ctx.serenity_context(), &reason).await {
        ctx.say(format!("No puedo expulsar a este usuario. Error: {}", e)).await?;
    } else {
        ctx.send(poise::CreateReply::default().embed(kick_embed)).await?;
    }

    Ok(())
}

/// Aplica un timeout a un miembro, impidiéndole interactuar.
#[poise::command(
    slash_command,
    required_permissions = "MODERATE_MEMBERS",
    default_member_permissions = "MODERATE_MEMBERS"
)]
pub async fn timeout(
    ctx: Context<'_>,
    #[description = "El miembro al que aplicar el timeout."] mut user: serenity::Member,
    #[description = "La duración del timeout (ej: 10m, 1h, 1d)."] duracion: String,
    #[description = "La razón para el timeout."] reason: Option<String>,
) -> Result<(), Error> {
    let reason = reason.unwrap_or_else(|| "No se proporcionó una razón.".to_string());
    
    let duration = match duracion.parse::<humantime::Duration>() {
        Ok(d) => d,
        Err(_) => {
            ctx.say("Por favor, proporciona una duración válida (ej: 5m, 2h, 3d).").await?;
            return Ok(());
        }
    };

    if user.user.id == ctx.author().id {
        ctx.say("No puedes aplicarte un timeout a ti mismo.").await?;
        return Ok(());
    }

    let until = serenity::Timestamp::from_unix_timestamp(
        (std::time::SystemTime::now() + *duration).duration_since(std::time::UNIX_EPOCH)?.as_secs() as i64
    )?;

    if let Err(e) = user.disable_communication_until_datetime(&ctx.serenity_context(), until).await {
        ctx.say(format!("No puedo aplicar el timeout. Error: {}", e)).await?;
    } else {
        let timeout_embed = serenity::CreateEmbed::new()
            .color(0x5865f2)
            .title("Usuario en Timeout")
            .field("Usuario", &user.user.tag(), true)
            .field("Moderador", &ctx.author().tag(), true)
            .field("Duración", &duracion, true)
            .field("Razón", &reason, false)
            .timestamp(serenity::Timestamp::now());

        ctx.send(poise::CreateReply::default().embed(timeout_embed)).await?;
    }

    Ok(())
}

/// Revoca el baneo de un usuario.
#[poise::command(
    slash_command,
    required_permissions = "BAN_MEMBERS",
    default_member_permissions = "BAN_MEMBERS"
)]
pub async fn unban(
    ctx: Context<'_>,
    #[description = "La ID del usuario que quieres desbanear."] user_id: String,
    #[description = "La razón para el desbaneo."] reason: Option<String>,
) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Must be in a guild")?;
    let reason = reason.unwrap_or_else(|| "No se proporcionó una razón.".to_string());
    
    let id = serenity::UserId::new(user_id.parse()?);

    match guild_id.unban(&ctx.serenity_context(), id).await {
        Ok(_) => {
            let unban_embed = serenity::CreateEmbed::new()
                .color(0x00ff00)
                .title("🟢 Usuario Desbaneado")
                .field("ID Usuario", user_id, true)
                .field("Moderador", &ctx.author().tag(), true)
                .field("Razón", &reason, false)
                .timestamp(serenity::Timestamp::now());

            ctx.send(poise::CreateReply::default().embed(unban_embed)).await?;
        }
        Err(e) => {
            ctx.say(format!("❌ No se pudo desbanear al usuario. Error: {}", e)).await?;
        }
    }

    Ok(())
}

/// Borra una cantidad específica de mensajes de este canal.
#[poise::command(
    slash_command,
    required_permissions = "MANAGE_MESSAGES",
    default_member_permissions = "MANAGE_MESSAGES"
)]
pub async fn clear(
    ctx: Context<'_>,
    #[description = "El número de mensajes a borrar (entre 1 y 100)."] 
    #[min = 1] #[max = 100]
    cantidad: u64,
) -> Result<(), Error> {
    let channel_id = ctx.channel_id();
    
    let messages = channel_id.messages(&ctx.serenity_context(), serenity::GetMessages::new().limit(cantidad as u8)).await?;
    let message_ids: Vec<serenity::MessageId> = messages.iter().map(|m| m.id).collect();
    
    match channel_id.delete_messages(&ctx.serenity_context(), message_ids).await {
        Ok(_) => {
            ctx.send(poise::CreateReply::default()
                .content(format!("✅ Se han borrado exitosamente **{}** mensajes.", messages.len()))
                .ephemeral(true)
            ).await?;
        }
        Err(_) => {
            ctx.say("❌ Hubo un error al intentar borrar los mensajes. Es posible que sean más antiguos de 14 días.").await?;
        }
    }

    Ok(())
}

/// Establece o elimina el modo lento en un canal.
#[poise::command(
    slash_command,
    required_permissions = "MANAGE_CHANNELS",
    default_member_permissions = "MANAGE_CHANNELS"
)]
pub async fn slowmode(
    ctx: Context<'_>,
    #[description = "Tiempo en segundos entre mensajes (0 para desactivar)."]
    #[min = 0] #[max = 21600]
    segundos: u64,
    #[description = "El canal donde aplicar el modo lento (por defecto, el actual)."]
    canal: Option<serenity::GuildChannel>,
) -> Result<(), Error> {
    let channel_id = canal.map(|c| c.id).unwrap_or(ctx.channel_id());
    
    if let Err(e) = channel_id.edit(&ctx.serenity_context(), serenity::EditChannel::new().rate_limit_per_user(segundos as u16)).await {
        ctx.say(format!("❌ Hubo un error al intentar establecer el modo lento: {}", e)).await?;
    } else {
        let color = if segundos > 0 { 0xffa500 } else { 0x00ff00 };
        let title = if segundos > 0 { "⏳ Modo Lento Activado" } else { "✅ Modo Lento Desactivado" };
        let description = if segundos > 0 { 
            format!("El modo lento en <#{}> ha sido establecido en **{} segundos**.", channel_id, segundos)
        } else {
            format!("El modo lento en <#{}> ha sido **desactivado**.", channel_id)
        };

        let slowmode_embed = serenity::CreateEmbed::new()
            .color(color)
            .title(title)
            .description(description)
            .timestamp(serenity::Timestamp::now());

        ctx.send(poise::CreateReply::default().embed(slowmode_embed)).await?;
    }

    Ok(())
}

/// Gestiona el bloqueo de un canal de texto.
#[poise::command(
    slash_command,
    required_permissions = "MANAGE_CHANNELS",
    default_member_permissions = "MANAGE_CHANNELS",
    subcommands("lock_on", "lock_off")
)]
pub async fn lock(_: Context<'_>) -> Result<(), Error> { Ok(()) }

/// Bloquea un canal para que @everyone no pueda enviar mensajes.
#[poise::command(slash_command, rename = "on")]
pub async fn lock_on(
    ctx: Context<'_>,
    #[description = "El canal a bloquear (por defecto, el actual)."]
    canal: Option<serenity::GuildChannel>,
    #[description = "Razón del bloqueo."]
    reason: Option<String>,
) -> Result<(), Error> {
    let channel_id = canal.map(|c| c.id).unwrap_or(ctx.channel_id());
    let guild_id = ctx.guild_id().ok_or("Not in a guild")?;
    let reason = reason.unwrap_or_else(|| "No se especificó una razón.".to_string());

    let overwrite = serenity::PermissionOverwrite {
        allow: serenity::Permissions::empty(),
        deny: serenity::Permissions::SEND_MESSAGES,
        kind: serenity::PermissionOverwriteType::Role(serenity::RoleId::new(guild_id.get())),
    };

    channel_id.create_permission(&ctx.serenity_context(), overwrite).await?;

    let lock_embed = serenity::CreateEmbed::new()
        .color(0xff0000)
        .title("🔒 Canal Bloqueado")
        .description(format!("El canal <#{}> ha sido bloqueado.", channel_id))
        .field("Razón", reason, false)
        .timestamp(serenity::Timestamp::now());

    ctx.send(poise::CreateReply::default().embed(lock_embed)).await?;
    Ok(())
}

/// Desbloquea un canal.
#[poise::command(slash_command, rename = "off")]
pub async fn lock_off(
    ctx: Context<'_>,
    #[description = "El canal a desbloquear (por defecto, el actual)."]
    canal: Option<serenity::GuildChannel>,
) -> Result<(), Error> {
    let channel_id = canal.map(|c| c.id).unwrap_or(ctx.channel_id());
    let guild_id = ctx.guild_id().ok_or("Not in a guild")?;

    channel_id.delete_permission(&ctx.serenity_context(), serenity::PermissionOverwriteType::Role(serenity::RoleId::new(guild_id.get()))).await?;

    let unlock_embed = serenity::CreateEmbed::new()
        .color(0x00ff00)
        .title("🔓 Canal Desbloqueado")
        .description(format!("El canal <#{}> ha sido desbloqueado.", channel_id))
        .timestamp(serenity::Timestamp::now());

    ctx.send(poise::CreateReply::default().embed(unlock_embed)).await?;
    Ok(())
}

/// Levanta el silencio (timeout) de un miembro.
#[poise::command(
    slash_command,
    required_permissions = "MODERATE_MEMBERS",
    default_member_permissions = "MODERATE_MEMBERS"
)]
pub async fn remove_timeout(
    ctx: Context<'_>,
    #[description = "El miembro al que quieres quitar el silencio."]
    mut user: serenity::Member,
    #[description = "La razón para levantar el silencio."]
    reason: Option<String>,
) -> Result<(), Error> {
    let reason = reason.unwrap_or_else(|| "El moderador decidió levantar el silencio.".to_string());

    if let Err(e) = user.enable_communication(&ctx.serenity_context()).await {
        ctx.say(format!("❌ Hubo un error al intentar levantar el silencio: {}", e)).await?;
    } else {
        let embed = serenity::CreateEmbed::new()
            .color(0x00ff00)
            .title("🟢 Silencio Levantado")
            .thumbnail(user.user.face())
            .field("Usuario", user.user.tag(), true)
            .field("Moderador", ctx.author().tag(), true)
            .field("Razón", reason, false)
            .timestamp(serenity::Timestamp::now());

        ctx.send(poise::CreateReply::default().embed(embed)).await?;
    }

    Ok(())
}

/// Muestra información detallada sobre un miembro del servidor.
#[poise::command(slash_command)]
pub async fn user_info(
    ctx: Context<'_>,
    #[description = "El miembro del que quieres ver la info."]
    user: Option<serenity::Member>,
) -> Result<(), Error> {
    let member = user.unwrap_or(ctx.author_member().await.ok_or("Not in a guild")?.into_owned());
    
    let roles = member.roles.iter()
        .map(|r| format!("<@&{}>", r))
        .collect::<Vec<_>>()
        .join(", ");

    let embed = serenity::CreateEmbed::new()
        .color(member.colour(&ctx.serenity_context()).unwrap_or_default())
        .title(format!("Información de {}", member.user.name))
        .thumbnail(member.user.face())
        .field("👤 Tag", format!("`{}`", member.user.tag()), true)
        .field("🆔 ID", format!("`{}`", member.user.id), true)
        .field("Nickname", member.nick.as_deref().unwrap_or("Ninguno"), true)
        .field("🤖 ¿Es un bot?", if member.user.bot { "Sí" } else { "No" }, true)
        .field("📅 Cuenta Creada", format!("<t:{}:F> (<t:{}:R>)", member.user.created_at().unix_timestamp(), member.user.created_at().unix_timestamp()), false)
        .field("📥 Se Unió al Servidor", format!("<t:{}:F> (<t:{}:R>)", member.joined_at.unwrap().unix_timestamp(), member.joined_at.unwrap().unix_timestamp()), false)
        .field("🎭 Roles", if roles.is_empty() { "Ningún rol".to_string() } else { roles }, false)
        .timestamp(serenity::Timestamp::now());

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}

/// Añade una advertencia a un miembro.
#[poise::command(
    slash_command,
    required_permissions = "MODERATE_MEMBERS",
    default_member_permissions = "MODERATE_MEMBERS"
)]
pub async fn warn(
    ctx: Context<'_>,
    #[description = "El miembro al que quieres advertir."]
    user: serenity::Member,
    #[description = "La razón de la advertencia."]
    reason: String,
) -> Result<(), Error> {
    if user.user.id == ctx.author().id {
        ctx.say("❌ No puedes advertirte a ti mismo.").await?;
        return Ok(());
    }
    if user.user.bot {
        ctx.say("❌ No puedes advertir a un bot.").await?;
        return Ok(());
    }

    let db = &ctx.data().db;
    let guild_id = ctx.guild_id().unwrap().to_string();
    let user_id = user.user.id.to_string();
    let moderator_id = ctx.author().id.to_string();
    let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_secs() as i64;

    sqlx::query("INSERT INTO warnings (user_id, guild_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)")
        .bind(&user_id)
        .bind(&guild_id)
        .bind(&moderator_id)
        .bind(&reason)
        .bind(timestamp)
        .execute(db)
        .await?;

    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM warnings WHERE user_id = ? AND guild_id = ?")
        .bind(&user_id)
        .bind(&guild_id)
        .fetch_one(db)
        .await?;

    let dm_embed = serenity::CreateEmbed::new()
        .color(0xffff00)
        .title("Has recibido una advertencia")
        .description(format!("Has recibido una advertencia en el servidor **{}**.", ctx.guild().unwrap().name))
        .field("Moderador", ctx.author().tag(), false)
        .field("Razón", &reason, false)
        .timestamp(serenity::Timestamp::now());

    let _ = user.user.dm(&ctx.serenity_context(), serenity::CreateMessage::new().embed(dm_embed)).await;

    let public_embed = serenity::CreateEmbed::new()
        .color(0xffff00)
        .title("🟡 Nueva Advertencia")
        .thumbnail(user.user.face())
        .field("Usuario", user.user.tag(), true)
        .field("Advertencias Totales", count.0.to_string(), true)
        .field("Moderador", ctx.author().tag(), false)
        .field("Razón", reason, false)
        .timestamp(serenity::Timestamp::now());

    ctx.send(poise::CreateReply::default().embed(public_embed)).await?;
    Ok(())
}

/// Muestra todas las advertencias de un miembro.
#[poise::command(
    slash_command,
    required_permissions = "MODERATE_MEMBERS",
    default_member_permissions = "MODERATE_MEMBERS"
)]
pub async fn warnings(
    ctx: Context<'_>,
    #[description = "El miembro cuyas advertencias quieres ver."]
    user: serenity::Member,
) -> Result<(), Error> {
    let db = &ctx.data().db;
    let guild_id = ctx.guild_id().unwrap().to_string();
    let user_id = user.user.id.to_string();

    let warns: Vec<(String, String, i64)> = sqlx::query_as("SELECT moderator_id, reason, timestamp FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC")
        .bind(&user_id)
        .bind(&guild_id)
        .fetch_all(db)
        .await?;

    if warns.is_empty() {
        ctx.say(format!("✅ El usuario {} no tiene ninguna advertencia.", user.user.tag())).await?;
        return Ok(());
    }

    let mut embed = serenity::CreateEmbed::new()
        .color(0xffff00)
        .title(format!("📜 Historial de Advertencias de {}", user.user.tag()))
        .description(format!("Se encontraron **{}** advertencia(s).", warns.len()))
        .thumbnail(user.user.face());

    for warn in warns {
        let mod_tag = serenity::UserId::new(warn.0.parse()?).to_user(&ctx.serenity_context()).await?.tag();
        let date = serenity::Timestamp::from_unix_timestamp(warn.2)?;
        embed = embed.field(
            format!("🗓️ {}", date.format("%Y-%m-%d")),
            format!("**Razón:** {}\n**Moderador:** `{}`", warn.1, mod_tag),
            false
        );
    }

    ctx.send(poise::CreateReply::default().embed(embed).ephemeral(true)).await?;
    Ok(())
}
