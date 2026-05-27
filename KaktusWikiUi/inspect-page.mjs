import axios from 'axios';
const res = await axios.get('https://playlegend.net/cactusclicker-wiki/runen/verstaerkte-dunkelheit/', {
  headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000
});
const html = res.data;
// Find the area around the rune image
const idx = html.indexOf('Reinforced-Darkness');
console.log(html.slice(Math.max(0,idx-800), idx+800));
