const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const DOJ_ROLE_ID = process.env.DISCORD_DOJ_ROLE_ID;

async function fetchDojMembers(): Promise<string[]> {
  if (!BOT_TOKEN || !GUILD_ID || !DOJ_ROLE_ID) return [];

  const memberIds: string[] = [];
  let after = '0';

  while (true) {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=100&after=${after}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!res.ok) {
      console.error('Failed to fetch guild members:', await res.text());
      break;
    }

    const members = await res.json();
    if (members.length === 0) break;

    for (const member of members) {
      if (member.roles?.includes(DOJ_ROLE_ID)) {
        memberIds.push(member.user.id);
      }
    }

    after = members[members.length - 1].user.id;
    if (members.length < 100) break;
  }

  return memberIds;
}

async function sendDm(userId: string, content: string): Promise<void> {
  if (!BOT_TOKEN) return;

  const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (!channelRes.ok) {
    console.warn(`Cannot open DM with user ${userId}`);
    return;
  }

  const channel = await channelRes.json();

  await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
}

function getWarrantTypeName(type: string): string {
  if (type === 'perquisition') return 'Mandat de Perquisition';
  if (type === 'arrestation') return "Mandat d'Arrestation";
  return 'Réquisition Judiciaire';
}

export async function notifyOfficerWarrantDecision(warrant: {
  type: string;
  targetName: string;
  officerId: string;
  status: 'approved' | 'rejected' | 'cancelled';
  judgeName: string;
  rejectionReason?: string;
  id: string;
  pdfToken?: string;
}): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN not set, skipping officer notification');
    return;
  }

  try {
    const appUrl = process.env.APP_URL || '';
    const typeName = getWarrantTypeName(warrant.type);
    let message = '';

    if (warrant.status === 'approved') {
      const pdfLink = `${appUrl}/api/warrants/${warrant.id}/pdf?token=${warrant.pdfToken}`;
      message =
        `✅ **Dossier approuvé**\n\n` +
        `**Type :** ${typeName}\n` +
        `**Cible :** ${warrant.targetName}\n` +
        `**Juge :** ${warrant.judgeName}\n\n` +
        `📄 Document officiel : ${pdfLink}`;
    } else if (warrant.status === 'rejected') {
      message =
        `❌ **Dossier refusé**\n\n` +
        `**Type :** ${typeName}\n` +
        `**Cible :** ${warrant.targetName}\n` +
        `**Juge :** ${warrant.judgeName}\n` +
        (warrant.rejectionReason ? `**Motif du refus :** ${warrant.rejectionReason}\n` : '') +
        `\n👉 Consultez le dossier : ${appUrl}`;
    } else if (warrant.status === 'cancelled') {
      message =
        `🚫 **Dossier annulé**\n\n` +
        `**Type :** ${typeName}\n` +
        `**Cible :** ${warrant.targetName}\n` +
        `**Par :** ${warrant.judgeName}\n\n` +
        `👉 Consultez le dossier : ${appUrl}`;
    }

    if (message) {
      await sendDm(warrant.officerId, message);
    }
  } catch (error) {
    console.error('Error notifying officer:', error);
  }
}

export async function notifyDojNewWarrant(warrant: {
  type: string;
  targetName: string;
  officerName: string;
  reason: string;
}): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN not set, skipping DOJ notifications');
    return;
  }

  try {
    const dojMembers = await fetchDojMembers();
    const appUrl = process.env.APP_URL || '';

    const message =
      `⚖️ **Nouveau dossier en attente de validation**\n\n` +
      `**Type :** ${getWarrantTypeName(warrant.type)}\n` +
      `**Cible :** ${warrant.targetName}\n` +
      `**Officier :** ${warrant.officerName}\n` +
      `**Motif :** ${warrant.reason}\n\n` +
      `👉 Consultez le dossier : ${appUrl}`;

    await Promise.allSettled(
      dojMembers.map((id) => sendDm(id, message))
    );
  } catch (error) {
    console.error('Error notifying DOJ members:', error);
  }
}
