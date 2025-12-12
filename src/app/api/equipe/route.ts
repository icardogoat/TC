'use server';

import { NextResponse } from 'next/server';

type Role = {
  id: string;
  name: string;
  color: number;
  position: number;
};

type Member = {
    user: {
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
        discriminator: string;
    };
    roles: string[];
    nick: string | null;
    pending?: boolean;
};

type TeamMember = {
    id: string;
    username: string;
    avatarUrl: string;
    highestRole: {
        name: string;
        color: string;
    }
}

// Lista de IDs dos cargos que fazem parte da equipe
const teamRoleIds = [
    '1330264307715543160',
    '1386368314682507365',
    '1330264306268242024',
    '1401024820241629239',
    '1330264302292303913',
    '1416816041564180672',
    '1330264300388089857',
    '1416814611721752629',
    '1416812315717926933',
    '1404644119548006420',
    '1330264299620274276'
];


async function fetchAllGuildMembers(guildId: string, botToken: string): Promise<Member[]> {
    let allMembers: Member[] = [];
    let lastUserId: string | null = null;
    const limit = 1000;

    while (true) {
        const url = `https://discord.com/api/v9/guilds/${guildId}/members?limit=${limit}` + (lastUserId ? `&after=${lastUserId}` : '');
        
        const response = await fetch(url, {
           headers: { Authorization: `Bot ${botToken}` },
           next: { revalidate: 3600 } // Cache members for 1 hour
        });

        if (!response.ok) {
            console.error("Failed to fetch guild members:", await response.text());
            throw new Error('Failed to fetch guild members');
        }

        const members: Member[] = await response.json();
        
        if (members.length === 0) {
            break; // No more members to fetch
        }

        allMembers = allMembers.concat(members);
        lastUserId = members[members.length - 1].user.id;

        if (members.length < limit) {
            break; // Fetched all members
        }
    }
    return allMembers;
}


export async function GET() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    return NextResponse.json({ error: 'Discord server not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch all roles from the guild
    const rolesResponse = await fetch(`https://discord.com/api/v9/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
      next: { revalidate: 3600 } // Cache roles for 1 hour
    });
    if (!rolesResponse.ok) throw new Error('Failed to fetch guild roles');
    const guildRoles: Role[] = await rolesResponse.json();

    // 2. Fetch ALL members from the guild using pagination
    const guildMembers = await fetchAllGuildMembers(guildId, botToken);
    
    // 3. Filter members and find their highest role from the specified list
    const team: TeamMember[] = [];

    for (const member of guildMembers) {
      if (member.user.bot || member.pending) continue; // Skip bots and pending members

      let highestRole: Role | null = null;
      
      const memberTeamRoles = member.roles.filter(roleId => teamRoleIds.includes(roleId));

      if (memberTeamRoles.length > 0) {
        for (const roleId of memberTeamRoles) {
            const role = guildRoles.find(r => r.id === roleId);
            if (role) {
                if (!highestRole || role.position > highestRole.position) {
                    highestRole = role;
                }
            }
        }
      }

      if (highestRole) {
        const discriminator = member.user.discriminator !== '0' 
            ? member.user.discriminator 
            : (parseInt(member.user.id.substring(member.user.id.length - 4)) % 5).toString();

        team.push({
          id: member.user.id,
          username: member.nick || member.user.global_name || member.user.username,
          avatarUrl: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`,
          highestRole: {
            name: highestRole.name,
            color: highestRole.color > 0 ? `#${highestRole.color.toString(16).padStart(6, '0')}` : '#99aab5',
          }
        });
      }
    }
    
    // Sort the team by role position (highest first)
    team.sort((a, b) => {
        const roleA = guildRoles.find(r => r.name === a.highestRole.name);
        const roleB = guildRoles.find(r => r.name === b.highestRole.name);
        return (roleB?.position || 0) - (roleA?.position || 0);
    });

    return NextResponse.json({ team });

  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
