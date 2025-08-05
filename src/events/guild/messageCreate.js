const { Events } = require("discord.js");
const COFFEE_KEYWORDS =
	/\b(?:cafecito|cafetera|cafes|café|iced coffee|flat white|cold brew|drip coffee|turkish coffee|french press|clever dripper|coffee maker|coffee grinder|coffee beans|coffee grounds|coffee break|coffee shop|coffee pot|pour over|aeropress|cappuccino|percolator|americano|macchiato|cafetière|espresso|cortado|caffeine|affogato|ristretto|frappe|siphon|chemex|barista|arabica|robusta|greca|geisha|decaf|latte|mocha|lungo|kaffe|moka|café|cafe|coffee|beans|bean|brew|roast|kalua)\b/i;

const JOB_OFFER_FORMAT = `
\`\`\`
✨💼 OFERTA DE EMPLEO 💼✨

**[1] 🎯 Puesto:** [Título del Puesto]
**[2] 🏢 Empresa/Cliente:** [Nombre de Empresa o "Individual"]
**[3] 🤝 Contratación:** [Tiempo Completo / Medio Tiempo / Contrato / Freelance / Gig]
**[4] 📍 Ubicación:** [Remoto / Ciudad, País / Presencial / Híbrido]
**[5] ⏰ Zona Horaria Requerido:** [Ej. PST / EST / GMT+1 / Flexible]

**[6] 📝 Descripción:**
[Descripción breve del rol o proyecto. ¿Qué problema resuelve? Objetivos principales. Máx. 2-4 frases.]

**[7] ✅ Responsabilidades:**
- [Tareas específicas a realizar.]
- [Claro y conciso.]
- [Usa viñetas.]
- [Ej. Gestionar Discord, Desarrollar web, Crear gráficos]

**[8] 🧠 Habilidades/Requisitos:**
- [Habilidades, experiencia o cualificaciones obligatorias.]

**[9] 💰 Compensación:**
[Ej. $X/hora, $Y tarifa fija, $Z/mes, Salario+Equity, Negociable (rango).]

**[10] 🗓 Fecha Límite:**
[Fecha, Hora, Zona Horaria (ej. 2024-12-31 17:00 EST) o "Abierta"]

**[11] 📧 Postulación:**
[Instrucciones claras: "DM @usuario", "Email a correo@ejemplo.com", "Link: https://tu.link"]
\`\`\`
`;

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		// Coffee keyword detection (unchanged)
		if (COFFEE_KEYWORDS.test(message.content)) {
			message.channel.send("`HTTP/1.1` **418** I'm a teapot");
			console.log(
				`Se detectó una conversación sobre café de ${message.author.tag} en #${message.channel.name}. Se envió '418 I'm a teapot'.`,
			);
		}

		// Job Offers channel logic
		if (message.channelId == process.env.OFFERS_CHANNEL_ID) {
			const isMessageAnOffer = isOffer(message.content);
			const mentionedRolesWithMagnifier = message.mentions.roles.filter(
				(role) => role.name.startsWith("🔍 | "),
			);

			// First, try to handle valid offers by creating a thread
			if (isMessageAnOffer) {
				let threadName;
				let roleUsedForThreadName = null; // To track if a magnifier role was used for naming

				if (mentionedRolesWithMagnifier.size > 0) {
					const role = mentionedRolesWithMagnifier.first();
					const cleanedRoleName = role.name.replace("🔍 | ", "").trim();
					threadName = `Oferta | ${cleanedRoleName}`;
					roleUsedForThreadName = role; // Store the role that was used
				} else {
					threadName = `Oferta de Empleo`; // Generic name if no specific role mentioned
				}

				try {
					await message.startThread({
						name: threadName,
						autoArchiveDuration: 60 * 24, // Archive after 24 hours of inactivity
						reason: "Job offer posted and automatically threaded by bot.",
					});
					console.log(
						`Se creó el hilo "${threadName}" para la oferta de empleo de ${message.author.tag}`,
					);

					// If thread was created successfully but no magnifier role was used for naming
					if (!roleUsedForThreadName) {
						const user = await message.client.users.fetch(message.author.id);
						const suggestionDM = `
¡Hola ${user}! Tu oferta ha sido publicada y se ha creado un hilo para ella.

**Sugerencia para Mayor Visibilidad y Organización:**

Para que tu oferta de empleo tenga aún más visibilidad y el hilo pueda nombrarse automáticamente (ej. "Oferta | Desarrollador Backend"), te recomendamos:
*   Mencionar un rol relevante en tu mensaje (ej. \`@🔍 | Desarrollador Backend\`).
*   Asegúrate de que el nombre de ese rol comience estrictamente con el emoji de lupa (🔍) seguido de " | " (espacio, barra vertical, espacio). Por ejemplo: \`@🔍 | Tu Rol\`.
    Esto ayudará a organizar el canal y facilitará la búsqueda de ofertas específicas.

¡Gracias!
						`.trim();
						try {
							await user.send(suggestionDM);
							console.log(
								`Se envió un DM de sugerencia de rol de lupa a ${user.tag}`,
							);
						} catch (dmError) {
							console.error(
								`No se pudo enviar el DM de sugerencia a ${message.author.id}:`,
								dmError,
							);
						}
					}
					return; // Successfully handled the message by creating a thread, so exit.
				} catch (error) {
					console.error(
						`No se pudo crear el hilo para el mensaje de ${message.author.tag}:`,
						error,
					);
				}
			}

			const authorId = message.author.id;
			message
				.delete()
				.then(async () => {
					const user = await message.client.users.fetch(authorId);

					const dmContentPart1 = `
¡Hola ${user}! Tu mensaje ha sido eliminado en el canal de ofertas. Aquí está el formato correcto que debes usar:

${JOB_OFFER_FORMAT}
					`.trim();

					const dmContentPart2 = `
**Instrucciones Importantes para Publicar tu Oferta:**

Para que tu oferta sea publicada exitosamente:
1.  **Usa el formato estrictamente:** Asegúrate de que tu mensaje contenga todos los puntos del 1 al 11 tal como se muestra en el formato de arriba.
2.  **El bot creará el hilo automáticamente:** Una vez que envíes tu mensaje con el formato correcto, el bot generará un hilo para tu oferta. ¡No necesitas crear el hilo manualmente!

**Sugerencia para Mayor Visibilidad y Organización:**

Para que tu oferta de empleo tenga aún más visibilidad y el hilo pueda nombrarse automáticamente (ej. "Oferta | Desarrollador Backend"), te recomendamos:
*   Mencionar un rol relevante en tu mensaje (ej. \`@🔍 | Desarrollador Backend\`).
*   Asegúrate de que el nombre de ese rol comience estrictamente con el emoji de lupa (🔍) seguido de " | " (espacio, barra vertical, espacio). Por ejemplo: \`@🔍 | Tu Rol\`.
    Esto ayudará a organizar el canal y facilitará la búsqueda de ofertas específicas.

¡Gracias por tu comprensión!
					`.trim();

					try {
						await user.send(dmContentPart1);
						await user.send(dmContentPart2);
						console.log(
							`Se enviaron 2 DMs a ${user.tag} sobre el mensaje de oferta eliminado.`,
						);
					} catch (dmError) {
						console.error(`No se pudo enviar el DM a ${authorId}:`, dmError);
						// Fallback: If DMs cannot be sent (e.g., user blocked DMs), send a public message in the channel
						await message.channel
							.send({
								content: `¡Hola <@${authorId}>! Tu mensaje fue eliminado. No pude enviarte un DM. Por favor, revisa tus configuraciones de privacidad para recibir mensajes del bot. Para publicar, asegúrate de seguir el formato correcto.`,
							})
							.catch(console.error);
					}

					console.log(
						`Mensaje eliminado de ${authorId}. Razón: Formato inválido o fallo en la creación del hilo.`,
					);
				})
				.catch(console.error);
		}
	},
};

/**
 * Validates if the given message content matches the job offering format.
 * It checks for the main header and the presence of all 11 section headers in order.
 * @param {string} messageContent The content of the Discord message.
 * @returns {boolean} True if the message content matches the offer format, false otherwise.
 */
const isOffer = (messageContent) => {
	if (!messageContent || typeof messageContent !== "string") {
		return false;
	}

	const requiredHeader = "✨💼 OFERTA DE EMPLEO 💼✨";
	const sectionHeaders = [
		"**[1] 🎯 Puesto:**",
		"**[2] 🏢 Empresa/Cliente:**",
		"**[3] 🤝 Contratación:**",
		"**[4] 📍 Ubicación:**",
		"**[5] ⏰ Zona Horaria Requerido:**",
		"**[6] 📝 Descripción:**",
		"**[7] ✅ Responsabilidades:**",
		"**[8] 🧠 Habilidades/Requisitos:**",
		"**[9] 💰 Compensación:**",
		"**[10] 🗓 Fecha Límite:**",
		"**[11] 📧 Postulación:**",
	];

	const escapeRegExp = (string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	};

	const patternParts = [escapeRegExp(requiredHeader)];

	for (const header of sectionHeaders) {
		patternParts.push(escapeRegExp(header));
	}

	const fullRegex = new RegExp(`^${patternParts.join(".*?")}`, "s");
	return messageContent.match(fullRegex) ? true : false;
};
