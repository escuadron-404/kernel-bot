use crate::{Context, Error};

/// Este comando aún está en construcción.
#[poise::command(slash_command, ephemeral = true)]
pub async fn profile(ctx: Context<'_>) -> Result<(), Error> {
    ctx.say("Este comando aún no está implementado.").await?;
    Ok(())
}
