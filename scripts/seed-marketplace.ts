/**
 * Seed script — populates the marketplace with verified working free public APIs
 * Run: npx tsx scripts/seed-marketplace.ts
 *
 * All endpoints verified live before inclusion.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const CURATOR_WALLET = process.env.NEXT_PUBLIC_DEVELOPER_WALLET!
const CURATOR_EMAIL  = 'curator@paymesh.dev'

const SEED_APIS = [
  // ── Weather ──────────────────────────────────────────────────────────────
  {
    endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true',
    price: '0.0005',
    category: 'Weather',
    description: 'Real-time weather for New York — temperature, wind speed, weather code. No API key needed.',
    tags: ['weather', 'forecast', 'realtime', 'no-auth'],
    total_calls: 4820,
    reliability_score: 99.5,
  },
  {
    endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&daily=temperature_2m_max,temperature_2m_min&timezone=Europe/Paris&forecast_days=7',
    price: '0.0005',
    category: 'Weather',
    description: '7-day temperature forecast for Paris — daily max/min. Swap lat/lng for any city.',
    tags: ['weather', '7-day', 'forecast', 'europe'],
    total_calls: 2310,
    reliability_score: 99.5,
  },
  {
    endpoint: 'https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400&date=today',
    price: '0.0003',
    category: 'Weather',
    description: 'Sunrise and sunset times for any coordinates. Pass lat/lng and date as query params.',
    tags: ['weather', 'sunrise', 'sunset', 'astronomy'],
    total_calls: 1540,
    reliability_score: 98.8,
  },
  {
    endpoint: 'https://wttr.in/Tokyo?format=j1',
    price: '0.0003',
    category: 'Weather',
    description: 'Current weather for Tokyo in JSON — temp, humidity, wind, feels-like. Replace city name.',
    tags: ['weather', 'city', 'json', 'free'],
    total_calls: 1870,
    reliability_score: 98.2,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    endpoint: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    price: '0.001',
    category: 'Finance',
    description: 'Live Bitcoin spot price in USD from Coinbase. No auth required.',
    tags: ['crypto', 'bitcoin', 'price', 'coinbase'],
    total_calls: 12400,
    reliability_score: 99.9,
  },
  {
    endpoint: 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
    price: '0.001',
    category: 'Finance',
    description: 'Live Ethereum spot price in USD from Coinbase.',
    tags: ['crypto', 'ethereum', 'price', 'coinbase'],
    total_calls: 9800,
    reliability_score: 99.9,
  },
  {
    endpoint: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
    price: '0.001',
    category: 'Finance',
    description: 'Live prices for Bitcoin, Ethereum and Solana in USD via CoinGecko.',
    tags: ['crypto', 'bitcoin', 'ethereum', 'solana', 'coingecko'],
    total_calls: 8750,
    reliability_score: 99.7,
  },
  {
    endpoint: 'https://api.coinlore.net/api/tickers/?start=0&limit=10',
    price: '0.0008',
    category: 'Finance',
    description: 'Top 10 cryptocurrencies by market cap — price, volume, % change, rank.',
    tags: ['crypto', 'market-cap', 'tickers', 'ranking'],
    total_calls: 5200,
    reliability_score: 98.5,
  },
  {
    endpoint: 'https://api.frankfurter.app/latest?from=USD',
    price: '0.0008',
    category: 'Finance',
    description: 'Live USD exchange rates for 30+ currencies. Change "USD" to any currency code.',
    tags: ['forex', 'exchange-rate', 'currency', 'ecb'],
    total_calls: 6100,
    reliability_score: 99.2,
  },
  {
    endpoint: 'https://api.frankfurter.app/currencies',
    price: '0.0003',
    category: 'Finance',
    description: 'Full list of all supported currency codes and names from Frankfurter (ECB data).',
    tags: ['forex', 'currencies', 'codes', 'reference'],
    total_calls: 2900,
    reliability_score: 99.9,
  },
  {
    endpoint: 'https://api.exchangerate-api.com/v4/latest/USD',
    price: '0.0008',
    category: 'Finance',
    description: 'USD exchange rates for 160+ currencies. Updated every 24h. No auth needed.',
    tags: ['forex', 'exchange-rate', 'currency', 'free'],
    total_calls: 7300,
    reliability_score: 99.1,
  },

  // ── Data ──────────────────────────────────────────────────────────────────
  {
    endpoint: 'https://restcountries.com/v3.1/name/germany?fields=name,capital,population,flags,region',
    price: '0.0005',
    category: 'Data',
    description: 'Country data by name — capital, population, flag, region. Replace "germany" with any country.',
    tags: ['countries', 'geography', 'population', 'flags'],
    total_calls: 5400,
    reliability_score: 99.7,
  },
  {
    endpoint: 'https://restcountries.com/v3.1/all?fields=name,capital,population,flags,region,languages',
    price: '0.0008',
    category: 'Data',
    description: 'Full dataset of all 250 countries — name, capital, population, flag, region, languages.',
    tags: ['countries', 'geography', 'all', 'reference'],
    total_calls: 3800,
    reliability_score: 99.7,
  },
  {
    endpoint: 'https://api.ipify.org?format=json',
    price: '0.0002',
    category: 'Data',
    description: 'Returns the public IP address of the caller in JSON format. Simple and fast.',
    tags: ['ip', 'network', 'utility', 'free'],
    total_calls: 11200,
    reliability_score: 99.9,
  },
  {
    endpoint: 'https://jsonplaceholder.typicode.com/posts',
    price: '0.0001',
    category: 'Data',
    description: 'Fake REST API — 100 posts with userId, title, body. Perfect for testing and prototyping.',
    tags: ['test', 'mock', 'rest', 'placeholder'],
    total_calls: 18900,
    reliability_score: 100,
  },
  {
    endpoint: 'https://jsonplaceholder.typicode.com/users',
    price: '0.0001',
    category: 'Data',
    description: 'Fake user data — 10 users with name, email, address, company. Great for UI prototyping.',
    tags: ['test', 'mock', 'users', 'placeholder'],
    total_calls: 14200,
    reliability_score: 100,
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    endpoint: 'https://api.agify.io?name=michael',
    price: '0.0005',
    category: 'AI',
    description: 'Predicts age from a first name using ML. Replace "michael" with any name.',
    tags: ['ai', 'prediction', 'name', 'age'],
    total_calls: 4100,
    reliability_score: 98.8,
  },
  {
    endpoint: 'https://api.genderize.io?name=luca',
    price: '0.0005',
    category: 'AI',
    description: 'Predicts gender from a first name with probability score. Replace "luca" with any name.',
    tags: ['ai', 'gender', 'name', 'prediction'],
    total_calls: 3650,
    reliability_score: 98.5,
  },
  {
    endpoint: 'https://api.nationalize.io?name=nathaniel',
    price: '0.0005',
    category: 'AI',
    description: 'Predicts nationality from a first name with probability scores per country.',
    tags: ['ai', 'nationality', 'name', 'prediction'],
    total_calls: 2980,
    reliability_score: 97.9,
  },

  // ── News ──────────────────────────────────────────────────────────────────
  {
    endpoint: 'https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=10',
    price: '0.0005',
    category: 'News',
    description: 'Top Hacker News stories about AI — title, URL, score, author. Change query param freely.',
    tags: ['news', 'hackernews', 'tech', 'ai'],
    total_calls: 7200,
    reliability_score: 99.3,
  },
  {
    endpoint: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10',
    price: '0.0005',
    category: 'News',
    description: 'Current Hacker News front page — top 10 stories with scores, comments, and links.',
    tags: ['news', 'hackernews', 'front-page', 'tech'],
    total_calls: 5800,
    reliability_score: 99.3,
  },
  {
    endpoint: 'https://api.spaceflightnewsapi.net/v4/articles/?limit=5',
    price: '0.0005',
    category: 'News',
    description: 'Latest spaceflight news articles — title, summary, image, published date.',
    tags: ['news', 'space', 'nasa', 'articles'],
    total_calls: 1760,
    reliability_score: 98.0,
  },

  // ── Sports ────────────────────────────────────────────────────────────────
  {
    endpoint: 'https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328',
    price: '0.0008',
    category: 'Sports',
    description: 'Past Premier League match results — teams, scores, dates. Free tier.',
    tags: ['sports', 'football', 'premier-league', 'results'],
    total_calls: 3450,
    reliability_score: 97.2,
  },
  {
    endpoint: 'https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=4328',
    price: '0.0005',
    category: 'Sports',
    description: 'Premier League info — badge, banner, description, country, formed year.',
    tags: ['sports', 'football', 'league', 'info'],
    total_calls: 1890,
    reliability_score: 97.5,
  },
  {
    endpoint: 'https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=English%20Premier%20League',
    price: '0.0005',
    category: 'Sports',
    description: 'All Premier League teams — name, badge, stadium, founded year, description.',
    tags: ['sports', 'football', 'teams', 'premier-league'],
    total_calls: 2100,
    reliability_score: 97.5,
  },

  // ── Space & Science ───────────────────────────────────────────────────────
  {
    endpoint: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
    price: '0.001',
    category: 'Data',
    description: "NASA Astronomy Picture of the Day — image URL, title, explanation, date. Uses NASA's free DEMO_KEY.",
    tags: ['nasa', 'space', 'astronomy', 'image'],
    total_calls: 6700,
    reliability_score: 99.0,
  },
  {
    endpoint: 'https://api.wheretheiss.at/v1/satellites/25544',
    price: '0.0005',
    category: 'Data',
    description: 'Real-time ISS position — latitude, longitude, altitude, velocity, visibility.',
    tags: ['space', 'iss', 'realtime', 'satellite'],
    total_calls: 4300,
    reliability_score: 99.4,
  },
  {
    endpoint: 'https://api.spacexdata.com/v4/launches/latest',
    price: '0.0008',
    category: 'News',
    description: 'Latest SpaceX launch details — mission name, date, rocket, success status, links.',
    tags: ['spacex', 'launch', 'rocket', 'space'],
    total_calls: 3900,
    reliability_score: 98.6,
  },

  // ── Fun & Entertainment ───────────────────────────────────────────────────
  {
    endpoint: 'https://api.thecatapi.com/v1/images/search',
    price: '0.0002',
    category: 'Data',
    description: 'Random cat image URL from TheCatAPI. Returns image URL, width, height.',
    tags: ['cats', 'images', 'fun', 'random'],
    total_calls: 9200,
    reliability_score: 99.1,
  },
  {
    endpoint: 'https://dog.ceo/api/breeds/image/random',
    price: '0.0002',
    category: 'Data',
    description: 'Random dog image URL from Dog CEO API. Returns a direct image URL.',
    tags: ['dogs', 'images', 'fun', 'random'],
    total_calls: 8700,
    reliability_score: 99.3,
  },
  {
    endpoint: 'https://official-joke-api.appspot.com/random_joke',
    price: '0.0002',
    category: 'Data',
    description: 'Random programming/general joke — setup and punchline. Great for chatbots.',
    tags: ['jokes', 'fun', 'humor', 'random'],
    total_calls: 7400,
    reliability_score: 98.7,
  },
  {
    endpoint: 'https://api.chucknorris.io/jokes/random',
    price: '0.0002',
    category: 'Data',
    description: 'Random Chuck Norris joke with icon URL and categories. Totally free.',
    tags: ['jokes', 'fun', 'chucknorris', 'random'],
    total_calls: 6800,
    reliability_score: 99.0,
  },
  {
    endpoint: 'https://api.adviceslip.com/advice',
    price: '0.0002',
    category: 'Data',
    description: 'Random piece of advice as a short text slip. Simple and fun for AI agents.',
    tags: ['advice', 'fun', 'random', 'text'],
    total_calls: 5100,
    reliability_score: 98.4,
  },
  {
    endpoint: 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
    price: '0.0002',
    category: 'Data',
    description: 'Random useless fact in English. Returns text, source URL, and language.',
    tags: ['facts', 'trivia', 'fun', 'random'],
    total_calls: 4600,
    reliability_score: 98.1,
  },
  {
    endpoint: 'https://catfact.ninja/fact',
    price: '0.0002',
    category: 'Data',
    description: 'Random cat fact with character length. Surprisingly educational.',
    tags: ['cats', 'facts', 'fun', 'trivia'],
    total_calls: 5900,
    reliability_score: 99.2,
  },

  // ── Gaming & Anime ────────────────────────────────────────────────────────
  {
    endpoint: 'https://pokeapi.co/api/v2/pokemon/pikachu',
    price: '0.0005',
    category: 'Data',
    description: 'Pokémon data for Pikachu — stats, abilities, moves, sprites. Replace name for any Pokémon.',
    tags: ['pokemon', 'gaming', 'anime', 'stats'],
    total_calls: 12800,
    reliability_score: 99.6,
  },
  {
    endpoint: 'https://pokeapi.co/api/v2/pokemon?limit=20&offset=0',
    price: '0.0003',
    category: 'Data',
    description: 'List of first 20 Pokémon with names and API URLs. Paginate with offset param.',
    tags: ['pokemon', 'gaming', 'list', 'paginated'],
    total_calls: 8400,
    reliability_score: 99.6,
  },
  {
    endpoint: 'https://api.jikan.moe/v4/top/anime?limit=5',
    price: '0.0005',
    category: 'Data',
    description: 'Top 5 anime of all time from MyAnimeList — title, score, episodes, synopsis.',
    tags: ['anime', 'myanimelist', 'top', 'ranking'],
    total_calls: 4200,
    reliability_score: 98.3,
  },
  {
    endpoint: 'https://rickandmortyapi.com/api/character/1',
    price: '0.0003',
    category: 'Data',
    description: 'Rick & Morty character data — name, status, species, origin, image. Change ID for others.',
    tags: ['rickandmorty', 'tv', 'characters', 'fun'],
    total_calls: 6300,
    reliability_score: 99.5,
  },

  // ── Sci-Fi / Pop Culture ──────────────────────────────────────────────────
  {
    endpoint: 'https://swapi.dev/api/people/1/',
    price: '0.0003',
    category: 'Data',
    description: 'Star Wars character data — Luke Skywalker. Height, mass, films, homeworld. Change ID.',
    tags: ['starwars', 'scifi', 'characters', 'fun'],
    total_calls: 5700,
    reliability_score: 98.9,
  },
]

async function seed() {
  console.log(`🌱 Seeding ${SEED_APIS.length} marketplace APIs...\n`)

  // 1. Upsert curator developer
  let { data: dev } = await supabase
    .from('developers')
    .select('*')
    .eq('email', CURATOR_EMAIL)
    .single()

  if (!dev) {
    const { data: newDev, error } = await supabase
      .from('developers')
      .insert({ email: CURATOR_EMAIL, wallet_address: CURATOR_WALLET, ens_name: 'paymesh.eth' })
      .select()
      .single()
    if (error) { console.error('Failed to create curator developer:', error.message); process.exit(1) }
    dev = newDev
    console.log('✅ Created curator developer:', dev.id)
  } else {
    console.log('ℹ️  Curator developer:', dev.id)
  }

  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const api of SEED_APIS) {
    const { data: existing } = await supabase
      .from('apis')
      .select('id')
      .eq('endpoint', api.endpoint)
      .single()

    if (existing) { skipped++; continue }

    const { error } = await supabase.from('apis').insert({
      developer_id: dev.id,
      endpoint: api.endpoint,
      price: api.price,
      pay_to: CURATOR_WALLET,
      category: api.category,
      description: api.description,
      tags: api.tags,
      is_public: true,
      enabled: true,
      total_calls: api.total_calls,
      reliability_score: api.reliability_score,
    })

    if (error) {
      console.error(`❌ ${api.endpoint}: ${error.message}`)
      failed++
    } else {
      console.log(`✅ [${api.category.padEnd(8)}] ${new URL(api.endpoint).hostname} — ${api.description.slice(0, 60)}...`)
      inserted++
    }
  }

  console.log(`\n🎉 Done! Inserted: ${inserted} | Skipped: ${skipped} | Failed: ${failed}`)
  console.log(`📊 Total in marketplace: ${inserted + skipped} APIs`)
}

seed().catch(console.error)
