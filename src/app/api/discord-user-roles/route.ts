'use server';

import { NextRequest, NextResponse } from 'next/server';

type Role = {
  id: string;
  name: string;
  color: number;
  position: number;
};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is missing' }, { status: 400 });
  }
  if (!guildId || !botToken) {
    return NextResponse.json({ error: 'Discord server not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch all roles from the guild to get hierarchy and details
    // This is cached for a long time (1 hour) because roles don't change often.
    const rolesResponse = await fetch(`https://discord.com/api/v9/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
       next: { revalidate: 3600 } // Cache roles for 1 hour
    });

    if (!rolesResponse.ok) {
      console.error('Failed to fetch guild roles:', await rolesResponse.text());
      return NextResponse.json({ error: 'Failed to fetch guild roles' }, { status: 500 });
    }
    const guildRoles: Role[] = await rolesResponse.json();

    // 2. Fetch the specific member's data to get their roles
    // This is cached for a short time (60 seconds) to ensure permission changes are reflected quickly.
    const memberResponse = await fetch(`https://discord.com/api/v9/guilds/${guildId}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 60 } // Cache member data for 1 minute
    });

    if (!memberResponse.ok) {
        // If user is not in the guild, it's a 404. This is not a server error.
        if (memberResponse.status === 404) {
            return NextResponse.json({ highestRole: null });
        }
      console.error('Failed to fetch member data:', await memberResponse.text());
      return NextResponse.json({ error: 'Failed to fetch member data' }, { status: 500 });
    }
    const member = await memberResponse.json();
    const memberRoleIds: string[] = member.roles;
    
    if (!memberRoleIds || memberRoleIds.length === 0) {
        return NextResponse.json({ highestRole: null });
    }

    // 3. Find the highest role for the member by position
    let highestRole: Role | null = null;
    
    for (const roleId of memberRoleIds) {
        const role = guildRoles.find(r => r.id === roleId);
        if (role) {
            if (!highestRole || role.position > highestRole.position) {
                highestRole = role;
            }
        }
    }
    
    // Convert decimal color to hex and provide a default if color is 0
    const highestRoleWithHexColor = highestRole ? {
        name: highestRole.name,
        color: highestRole.color > 0 ? `#${highestRole.color.toString(16).padStart(6, '0')}` : '#99aab5' // Discord's default role color
    } : null;

    return NextResponse.json({ highestRole: highestRoleWithHexColor });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
