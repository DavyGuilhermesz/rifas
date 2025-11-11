import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventType, data } = await req.json();

    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('Discord Webhook URL not configured');
    }

    let embed: any;

    switch (eventType) {
      case 'raffle_created':
        embed = {
          title: '🎫 Nova Rifa Criada!',
          color: 0x3b82f6, // Blue
          thumbnail: {
            url: data.imageUrl || 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
          },
          fields: [
            {
              name: '📋 Título',
              value: data.title,
              inline: false,
            },
            {
              name: '💰 Preço por Número',
              value: `R$ ${data.price.toFixed(2)}`,
              inline: true,
            },
            {
              name: '🎯 Total de Números',
              value: `${data.totalTickets} números`,
              inline: true,
            },
            {
              name: '💵 Arrecadação Potencial',
              value: `R$ ${(data.price * data.totalTickets).toFixed(2)}`,
              inline: true,
            },
          ],
          description: data.description || 'Sem descrição',
          timestamp: new Date().toISOString(),
          footer: {
            text: '🎰 RifaMax - Sistema Profissional de Rifas',
            icon_url: 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
          },
        };
        break;

      case 'raffle_deleted':
        embed = {
          title: '🗑️ Rifa Deletada',
          color: 0xef4444, // Red
          fields: [
            {
              name: '📋 Rifa',
              value: data.title,
              inline: false,
            },
            {
              name: '⚠️ Motivo',
              value: 'Deletada pelo administrador',
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: '🎰 RifaMax - Sistema Profissional de Rifas',
            icon_url: 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
          },
        };
        break;

      case 'payment_approved':
        const numbersText = data.ticketNumbers.length > 10 
          ? `${data.ticketNumbers.slice(0, 10).join(', ')}... (+${data.ticketNumbers.length - 10} mais)`
          : data.ticketNumbers.join(', ');

        embed = {
          title: '✅ Pagamento Aprovado!',
          color: 0x10b981, // Green
          fields: [
            {
              name: '🎫 Rifa',
              value: data.raffleName,
              inline: false,
            },
            {
              name: '👤 Participante',
              value: data.participantName,
              inline: true,
            },
            {
              name: '🔢 Números',
              value: numbersText,
              inline: true,
            },
            {
              name: '📊 Quantidade',
              value: `${data.ticketNumbers.length} número(s)`,
              inline: true,
            },
            {
              name: '💰 Valor Total',
              value: `R$ ${data.totalAmount.toFixed(2)}`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: '🎰 RifaMax - Sistema Profissional de Rifas',
            icon_url: 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
          },
        };
        break;

      case 'winner_selected':
        embed = {
          title: '🏆 VENCEDOR SORTEADO!',
          color: 0xfbbf24, // Gold
          thumbnail: {
            url: 'https://images.unsplash.com/photo-1607457903446-d32c88e9f0f6?w=400',
          },
          fields: [
            {
              name: '🎫 Rifa',
              value: data.raffleName,
              inline: false,
            },
            {
              name: '🎉 Vencedor',
              value: data.winnerName,
              inline: true,
            },
            {
              name: '🎯 Número Sorteado',
              value: `**${data.winnerNumber}**`,
              inline: true,
            },
            {
              name: '💰 Prêmio',
              value: data.prize || 'Conforme descrito na rifa',
              inline: false,
            },
            {
              name: '📊 Total de Participantes',
              value: `${data.totalParticipants} pessoas`,
              inline: true,
            },
            {
              name: '💵 Total Arrecadado',
              value: `R$ ${data.totalRevenue.toFixed(2)}`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: '🎰 RifaMax - Sistema Profissional de Rifas',
            icon_url: 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
          },
        };
        break;

      default:
        throw new Error('Unknown event type');
    }

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'RifaMax Bot',
        avatar_url: 'https://media.discordapp.net/attachments/1432811063216312451/1432969369155014726/Icon_Los_Aztecas.png?ex=691376f8&is=69122578&hm=7f45405973ec74a0bb746ec54641f811227f96098b035d5d5a698073c46db873&=&format=webp&quality=lossless&width=326&height=324',
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      throw new Error(`Discord: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
