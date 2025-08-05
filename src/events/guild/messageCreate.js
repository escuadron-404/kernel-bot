const { Events, MessageType, MessageFlags } = require("discord.js");
const COFFEE_KEYWORDS =
	/\b(?:cafecito|cafetera|cafes|café|iced coffee|flat white|cold brew|drip coffee|turkish coffee|french press|clever dripper|coffee maker|coffee grinder|coffee beans|coffee grounds|coffee break|coffee shop|coffee pot|pour over|aeropress|cappuccino|percolator|americano|macchiato|cafetière|espresso|cortado|caffeine|affogato|ristretto|frappe|siphon|chemex|barista|arabica|robusta|greca|geisha|decaf|latte|mocha|lungo|kaffe|moka|café|cafe|coffee|beans|bean|brew|roast|kalua)\b/i;

const JOB_OFFER_FORMAT = `
\`\`\`
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
\`\`\`
`;

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		if (COFFEE_KEYWORDS.test(message.content)) {
			message.channel.send("`HTTP/1.1` **418** I'm a teapot");
			console.log(
				`Detected coffee talk from ${message.author.tag} in #${message.channel.name}. Sent '418 I'm a teapot'.`,
			);
		}

		if (message.channelId == process.env.OFFERS_CHANNEL_ID) {
			if (
				!(
					(message.type == MessageType.ThreadStarterMessage &&
						isOffer(message.content)) ||
					message.hasThread ||
					message.type == MessageType.ThreadCreated
				)
			) {
				const authorId = message.author.id;
				const originalMessageContent = message.content;

				message
					.delete()
					.then(async () => {
						const rejectionMessageContent = `
¡Hola <@${authorId}>! Tu mensaje ha sido eliminado en el canal de ofertas.

Para publicar una oferta de empleo, debes iniciar un nuevo hilo (**¡IMPORTANTE! Si el mensaje que envías no inicia un hilo, será eliminado.**) y seguir estrictamente el formato:

${JOB_OFFER_FORMAT}
						`.trim();

						await message.channel
							.send({
								content: rejectionMessageContent,
								flags: MessageFlags.Ephemeral,
							})
							.then(() =>
								console.log(
									`Replied to message "${originalMessageContent}" from <@${authorId}>`,
								),
							)
							.catch(console.error);

						console.log(
							`Deleted message from ${authorId}. Reason: Not in thread and not valid offer in Offers channel`,
						);
					})
					.catch(console.error);
			}
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

	const requiredHeader =
		":sparkles::briefcase: OFERTA DE EMPLEO :briefcase::sparkles:";
	const sectionHeaders = [
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

	const escapeRegExp = (string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	};

	const patternParts = [escapeRegExp(requiredHeader)];

	for (const header of sectionHeaders) {
		patternParts.push(escapeRegExp(header));
	}

	const fullRegex = new RegExp(`^${patternParts.join(".*?")}`, "s");
	console.log(fullRegex);
	return fullRegex.test(messageContent);
};
