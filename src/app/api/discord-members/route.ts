import { NextResponse } from 'next/server';

export async function GET() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId) {
    return NextResponse.json({ error: 'Discord Guild ID not configured' }, { status: 500 });
  }
  if (!botToken) {
    return NextResponse.json({ error: 'Discord Bot Token not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://discord.com/api/v9/guilds/${guildId}?with_counts=true`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
        console.error(`Failed to fetch Discord guild data: ${response.statusText}`);
        const errorData = await response.text();
        console.error(errorData);
        return NextResponse.json({ count: null, error: `Could not fetch guild data. Check your Guild ID and Bot Token.` });
    }
    
    const data = await response.json();
    
    // approximate_member_count is the total number of members in the guild
    const memberCount = data.approximate_member_count || 0;

    return NextResponse.json({ count: memberCount });

  } catch (error) {
    console.error('Error fetching Discord member count:', error);
    return NextResponse.json({ error: 'Failed to fetch member count' }, { status: 500 });
  }
}

// To make this work:
// 1. Create a Discord Application and a Bot: https://discord.com/developers/applications
// 2. Add the bot to your server. You do NOT need any privileged intents for this to work.
// 3. Create a file named .env.local in the root of your project.
// 4. Add your Discord Server ID and Bot Token to it:
//    DISCORD_GUILD_ID=your_server_id_here
//    DISCORD_BOT_TOKEN=your_bot_token_here
// You can get your Server ID by right-clicking on your server icon in Discord (with Developer Mode enabled).