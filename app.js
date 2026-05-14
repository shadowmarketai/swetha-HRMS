// =====================================================
// SAFE STORAGE WRAPPER
// =====================================================
const safeStorage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
  getJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } },
  setJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
};

// =====================================================
// SECURITY UTILITIES
// =====================================================
function escapeHTML(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\/g,'\\\\');
}

// =====================================================
// AUTHENTICATED URL HELPER
// =====================================================
// Append JWT token as query param for browser-initiated requests (img src, a href)
function authUrl(path) {
  if (!path) return '';
  var token = JWT_TOKEN || safeStorage.get('hrms_jwt');
  if (!token) return path;
  var sep = path.indexOf('?') >= 0 ? '&' : '?';
  return path + sep + 'token=' + encodeURIComponent(token);
}

// =====================================================
// LAZY CDN LOADERS
// =====================================================
let _jsPdfLoaded = false, _chartJsLoaded = false;
function loadJsPdf() {
  if (_jsPdfLoaded || (typeof jspdf !== 'undefined' && jspdf.jsPDF)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => { _jsPdfLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadChartJs() {
  if (_chartJsLoaded || typeof Chart !== 'undefined') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => { _chartJsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// =====================================================
// COMPANY INFO
// =====================================================
const COMPANY_NAME = 'SWETHA STRUCTURES PRIVATE LIMITED';
const COMPANY_SHORT = 'Swetha Structures Pvt Ltd';
const COMPANY_ADDRESS = 'No.44, Alagu Nagar, Saravanampatti, Coimbatore, Tamilnadu 641035';
const COMPANY_GSTIN = '33AAWCS9286M1Z6';
const COMPANY_LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAQUAAABgCAIAAAHsvcANAAAKQ2lDQ1BJQ0MgcHJvZmlsZQAAeNqdU3dYk/cWPt/3ZQ9WQtjwsZdsgQAiI6wIyBBZohCSAGGEEBJAxYWIClYUFRGcSFXEgtUKSJ2I4qAouGdBiohai1VcOO4f3Ke1fXrv7e371/u855zn/M55zw+AERImkeaiagA5UoU8Otgfj09IxMm9gAIVSOAEIBDmy8JnBcUAAPADeXh+dLA//AGvbwACAHDVLiQSx+H/g7pQJlcAIJEA4CIS5wsBkFIAyC5UyBQAyBgAsFOzZAoAlAAAbHl8QiIAqg0A7PRJPgUA2KmT3BcA2KIcqQgAjQEAmShHJAJAuwBgVYFSLALAwgCgrEAiLgTArgGAWbYyRwKAvQUAdo5YkA9AYACAmUIszAAgOAIAQx4TzQMgTAOgMNK/4KlfcIW4SAEAwMuVzZdL0jMUuJXQGnfy8ODiIeLCbLFCYRcpEGYJ5CKcl5sjE0jnA0zODAAAGvnRwf44P5Dn5uTh5mbnbO/0xaL+a/BvIj4h8d/+vIwCBAAQTs/v2l/l5dYDcMcBsHW/a6lbANpWAGjf+V0z2wmgWgrQevmLeTj8QB6eoVDIPB0cCgsL7SViob0w44s+/zPhb+CLfvb8QB7+23rwAHGaQJmtwKOD/XFhbnauUo7nywRCMW735yP+x4V//Y4p0eI0sVwsFYrxWIm4UCJNx3m5UpFEIcmV4hLpfzLxH5b9CZN3DQCshk/ATrYHtctswH7uAQKLDljSdgBAfvMtjBoLkQAQZzQyefcAAJO/+Y9AKwEAzZek4wAAvOgYXKiUF0zGCAAARKCBKrBBBwzBFKzADpzBHbzAFwJhBkRADCTAPBBCBuSAHAqhGJZBGVTAOtgEtbADGqARmuEQtMExOA3n4BJcgetwFwZgGJ7CGLyGCQRByAgTYSE6iBFijtgizggXmY4EImFINJKApCDpiBRRIsXIcqQCqUJqkV1II/ItchQ5jVxA+pDbyCAyivyKvEcxlIGyUQPUAnVAuagfGorGoHPRdDQPXYCWomvRGrQePYC2oqfRS+h1dAB9io5jgNExDmaM2WFcjIdFYIlYGibHFmPlWDVWjzVjHVg3dhUbwJ5h7wgkAouAE+wIXoQQwmyCkJBHWExYQ6gl7CO0EroIVwmDhDHCJyKTqE+0JXoS+cR4YjqxkFhGrCbuIR4hniVeJw4TX5NIJA7JkuROCiElkDJJC0lrSNtILaRTpD7SEGmcTCbrkG3J3uQIsoCsIJeRt5APkE+S+8nD5LcUOsWI4kwJoiRSpJQSSjVlP+UEpZ8yQpmgqlHNqZ7UCKqIOp9aSW2gdlAvU4epEzR1miXNmxZDy6Qto9XQmmlnafdoL+l0ugndgx5Fl9CX0mvoB+nn6YP0dwwNhg2Dx0hiKBlrGXsZpxi3GS+ZTKYF05eZyFQw1zIbmWeYD5hvVVgq9ip8FZHKEpU6lVaVfpXnqlRVc1U/1XmqC1SrVQ+rXlZ9pkZVs1DjqQnUFqvVqR1Vu6k2rs5Sd1KPUM9RX6O+X/2C+mMNsoaFRqCGSKNUY7fGGY0hFsYyZfFYQtZyVgPrLGuYTWJbsvnsTHYF+xt2L3tMU0NzqmasZpFmneZxzQEOxrHg8DnZnErOIc4NznstAy0/LbHWaq1mrX6tN9p62r7aYu1y7Rbt69rvdXCdQJ0snfU6bTr3dQm6NrpRuoW623XP6j7TY+t56Qn1yvUO6d3RR/Vt9KP1F+rv1u/RHzcwNAg2kBlsMThj8MyQY+hrmGm40fCE4agRy2i6kcRoo9FJoye4Ju6HZ+M1eBc+ZqxvHGKsNN5l3Gs8YWJpMtukxKTF5L4pzZRrmma60bTTdMzMyCzcrNisyeyOOdWca55hvtm82/yNhaVFnMVKizaLx5balnzLBZZNlvesmFY+VnlW9VbXrEnWXOss623WV2xQG1ebDJs6m8u2qK2brcR2m23fFOIUjynSKfVTbtox7PzsCuya7AbtOfZh9iX2bfbPHcwcEh3WO3Q7fHJ0dcx2bHC866ThNMOpxKnD6VdnG2ehc53zNRemS5DLEpd2lxdTbaeKp26fesuV5RruutK10/Wjm7ub3K3ZbdTdzD3Ffav7TS6bG8ldwz3vQfTw91jicczjnaebp8LzkOcvXnZeWV77vR5Ps5wmntYwbcjbxFvgvct7YDo+PWX6zukDPsY+Ap96n4e+pr4i3z2+I37Wfpl+B/ye+zv6y/2P+L/hefIW8U4FYAHBAeUBvYEagbMDawMfBJkEpQc1BY0FuwYvDD4VQgwJDVkfcpNvwBfyG/ljM9xnLJrRFcoInRVaG/owzCZMHtYRjobPCN8Qfm+m+UzpzLYIiOBHbIi4H2kZmRf5fRQpKjKqLupRtFN0cXT3LNas5Fn7Z72O8Y+pjLk722q2cnZnrGpsUmxj7Ju4gLiquIF4h/hF8ZcSdBMkCe2J5MTYxD2J43MC52yaM5zkmlSWdGOu5dyiuRfm6c7Lnnc8WTVZkHw4hZgSl7I/5YMgQlAvGE/lp25NHRPyhJuFT0W+oo2iUbG3uEo8kuadVpX2ON07fUP6aIZPRnXGMwlPUit5kRmSuSPzTVZE1t6sz9lx2S05lJyUnKNSDWmWtCvXMLcot09mKyuTDeR55m3KG5OHyvfkI/lz89sVbIVM0aO0Uq5QDhZML6greFsYW3i4SL1IWtQz32b+6vkjC4IWfL2QsFC4sLPYuHhZ8eAiv0W7FiOLUxd3LjFdUrpkeGnw0n3LaMuylv1Q4lhSVfJqedzyjlKD0qWlQyuCVzSVqZTJy26u9Fq5YxVhlWRV72qX1VtWfyoXlV+scKyorviwRrjm4ldOX9V89Xlt2treSrfK7etI66Trbqz3Wb+vSr1qQdXQhvANrRvxjeUbX21K3nShemr1js20zcrNAzVhNe1bzLas2/KhNqP2ep1/XctW/a2rt77ZJtrWv913e/MOgx0VO97vlOy8tSt4V2u9RX31btLugt2PGmIbur/mft24R3dPxZ6Pe6V7B/ZF7+tqdG9s3K+/v7IJbVI2jR5IOnDlm4Bv2pvtmne1cFoqDsJB5cEn36Z8e+NQ6KHOw9zDzd+Zf7f1COtIeSvSOr91rC2jbaA9ob3v6IyjnR1eHUe+t/9+7zHjY3XHNY9XnqCdKD3x+eSCk+OnZKeenU4/PdSZ3Hn3TPyZa11RXb1nQ8+ePxd07ky3X/fJ897nj13wvHD0Ivdi2yW3S609rj1HfnD94UivW2/rZffL7Vc8rnT0Tes70e/Tf/pqwNVz1/jXLl2feb3vxuwbt24m3Ry4Jbr1+Hb27Rd3Cu5M3F16j3iv/L7a/eoH+g/qf7T+sWXAbeD4YMBgz8NZD+8OCYee/pT/04fh0kfMR9UjRiONj50fHxsNGr3yZM6T4aeypxPPyn5W/3nrc6vn3/3i+0vPWPzY8Av5i8+/rnmp83Lvq6mvOscjxx+8znk98ab8rc7bfe+477rfx70fmSj8QP5Q89H6Y8en0E/3Pud8/vwv94Tz+4A5JREAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAADhmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuYjBmOGJlOTAsIDIwMjEvMTIvMTUtMjE6MjU6MTUgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NWFjMWE5NGYtZTViYS1hNDQ4LWJiYzQtMzJlYWYxNTk2ODg0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVENUJGNTc5QzIwNjExRUY5OUQzRDIyREUzNDA2QTZCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVENUJGNTc4QzIwNjExRUY5OUQzRDIyREUzNDA2QTZCIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjU2NTg0NTZlLTQwYWYtZjg0NC1hZWFiLTY3ODFhMjIxNGI1NCIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmJmMjM0MDQ4LWI0OTAtMGI0YS04Njc2LWUxYmZhNGFkZmJkYyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsI9W3gAACV1SURBVHjaYvz//z8DjQETA+3B4LPD1Lx0yvQtTz/9IM2S/0SDf//+PXj3BYKa2zYRr5EEfzAyMjIzMSkIxTExMm7adJUEjSSlK0bGUAaGf9//r+UgJagYBybtTuyfYGFqVl5aevbMWSD36JGjoUHBmWnpUyZNfvPmDURNcmLShfMXdmzfjqzx+7dvCxcsIMqOh08eu3i4yyspvX7zOjcvb/XaNSoa6n8Y/n/++uX8hQsQNfxCggaGBr///Hn9+vXUadOAIukZGZxcXPEJCYMmrKgOAAKIcbS8opEdD959nTpjGyNjCK3i4/uf/68+f4Ow5QW5aeKPqZN2MjIwKAgl8XCw0TBdvfz+W4IrhoHh7///awZ92l23dl14aNiJ4yfgpZC7iyuQcfny5ckTJwEZGWlpSxYvBjK6OjuBpIujE5D8+vUrkLSztiGhjpo7bx4uqfPnz5eVlwMZe/buPXjoEETw7NmzwMJq8eLFmOqHSz4HCCB6+GOYFFdD3humplWMjIGMjDEZGfOHZKJiZAx+9H4xssjffwyKwjH//68bMt54/Pidt/9ERjD70vkbDAxceoZyjIwM/xgYL51toEl0/KcNYGAIePjuCxAxMAQxMIQ9ev8VWEUzMUXSyDpa5Y3//9fLCXIf3XGBheU3Gxvzxydv5QW5/v5dNpBZHNha//PnD9DTQLKmqvr58+c3b9wAtt8hssDWPZC0MreY0NdfUlR07uzZgwcO7tq5Eyj44d3Fb9/WnjlTqaEhuWXzZqA5wBb9/fv3QdXppUtwE969ewckZ0yfDq9ynz59+ub168ULF0EMp1reABrNyMQE7Asys7AwMYE8//vXL4gUsCsAlMUk2Tk4fv74ARf59u0bFxcXJBkDu3vAEAF2LIEkI8wQuEVoGkerv1FvDAgACKDhkKiYRpPTqB9G/UAPP9y584KRMfT6g3eMjBF//vyloSdo1DJjZgn/+///3Zcf7774+OLrj6cvPra1raeRXSy0iYFXv36vePrhGysbyPxfv/4ysLPYu+kPpbSkqpr2+P3Xf////wNXPhCGpKKYmXkLLayjSTzoGev7OXeBEuq//xu2F4f6Tfjz9x/QNxwcv4aMHy6dvblweZ6jh8H3byBHHzxd//7Dt/lTt125+HbI+OHr10XsXGzPPnxDFvz3n2XVqvQhkx+4uNh8PJs5//6FN8bWLNwfE2ExxMpWCBAVzb395IOpWSNNbRkx7dY7t+842jv4eHnv2b0byJ0+ddqtW7cCfP0a60EDMHfv3oUoW74UNAiQm5UNZAB7zCVFxQcOHGhtbrGxtAKqB0r9+PGjq6Nj1syZX79+BUoBRZYuWQLsQK9euaq7s6uvt3fzpk1ABrC/6uXu8eHDh8+fP1PND7///N5/8EBrW6uLK2iwPCUtFeiI79+/A3vGwYFBhXn5EGWR0VGgGu33b24enlUrVioqKty6eZOFhQWoTEFB4ffv30DHXb50Gch9/uy5kKAg0JVAQ06cPiUmLl5aXvbt6zdfPz+g7MEDB758+cLMxPzkyRNq5oe/YPDt61cgG0gC7YOIA4MW6DKg1K+fPyFSqMqgDDgXTYQgSdQAFzGK1q1fv3TZsmXLlwPZq1evhgiWV1RUVVU9evRo+/btCxct+vDxY3xCwrdv3yZNngyU9fP3f/XqVW5uLpBdV1//5s0bICMlJQVI5ufnA8nCoiIguWbtWrgtaenpEAYwHUZGRQEZWdnZo3l61A+jfhh5fgAIwL61xjR1hmFOLwgUxk1ALLetBS0g2Aq0FBTINoGwrdyKQDETTAQMMiMTAYVNmIsRk43xa7AJGypbJAtTXNS4xM0JFKWWYmJLC4OWgfygN6Atve4tRwh/tuyHLqDn/fHl+Z5+l/ec932/8/V7z3lFDi0xb8IEswRmCUwwS2CW2HgSG1eLILnnL/w09ZcGQbjiKSWCFMzOapNTzgJ/9+4otnd66RIcUum7jfRr/+carX71GM6GQxC0tFettmAvEoLkCARf0OlBmCVeigSQK+obc1OzYvE45N9burttIXuWDPHP02j+mCVesDx7pvX3L/tjqGnZYF7P22ym0MgQ6RMFguDWkQ7zmqXDhV8tLHRilnjBYjSaq2uu4HBOb4Zu5RYlWu1JJ5thyUj1LxmfuUTZfkRn+1G1YP+0xNWZeLrqeyLRycMDaTiTv1ksQdgsijo6EoYGpyKiAt/nskwmy4rj21ayZs8FKIvFCkCzuHyxpdgJydWou7C900uR/v6G7X5uof6HAz1crP8QycBrZ5VOSI5O1/2Gu/Nm2jzZNqH83Dvk4MAN3VHRdaXfwSFnfEaNJ/DOnbsOJA5XpFItbcaLwk4AX7nnxJhEgicQvDy9ZOOyLY6Oer2BFk6TjknNZrPJZCQQCOSAAPmUHAzv5e21tLj4FoUik8pcXUkRkZFjY2NhYWGrT2bj8KNH8Ovkn5NQhb6urm7Ly8uAmSzmQH8/Ho/fsXOnRCyOYzKlUqlyXgl9JRIx8EajCY/HwRTxbPYQnw8+ZrVanJyd6XT64MAgKAJt4CfAAQHkgMBAGHNwYAA0jImNFQwPg5LQUigUEojEZYMB+IiISE8vT/4gH8aBjjA7tDGZTCQSSafTIQjCio/fcKvTxQvNrNg4g8HQc+0a3MoEVnx7WxvwnzU2HSzk1dXUABaJRE9GR+25vIz3igoK305OAfzbvXtWqzU7MwsdZ0QoZMbEPhx6CPjE8eMombIvCUgAt2/d0mg0AE7X1iXv3bdeATaTBaVcLv/l5k17pq+sDJRJfefdnKxsqHZ2dBzkFR0uLgbMKyjI5+ahvX7o7r70zbd72QmAQf/7v9+HG22/nObm9Ze2lv5M278fysXFxe86OgFkczI33OqkVqnEYgljD8NischkMiqFotPrXVxcRCMicCjY7Efvjn4sEODxhIjICIlYEhwSDDEBboXDIZG7do2KREQicSeNZjaZhcLHCYmJEAdAuru7Qxelcn43nS4YFkRFR00rFCqVmsGgg94KuVyt1kRF7dIuLEAMbfXZ6uvrq1GrJyYmmCzWqGhUr9eBv4NnQDTY30NHEAhBpVJp0OuDgoNBbVAPHJxCpdh3LzicSqWCGQGPCEdIJBdqaCiKUY+lhYdPjI8HBQWBvdHR9sTEoG/Kb6CYqD51quvyZQBdXV0PHjxoa29H+TP19WcbG9G89/UbN1DyAw4HSjS/PTk5+fHJkz09PYDb2toam5rgPgLO5XJPVFXNzMwALi4pWctmF/J41dXVzwNIJKo4dqy2rg6wQqE4UloKvdZPUVZeDmVvby8nM/PTs/aXY2Ai0OfrlXhda2ZP+ut0B/Lz0Sx6a2sr8F+2tAAe5PNBPZgUbZadk/PhoUMoLigs/I859v/165X09PTkpCQAZouFzWb39fWhvFgszuNyhwUCwPhV9wkJCRFLJBarFXWFjIyM+JUFF9w8/8ABHx+flT8QjkU8HvpFSHpamp+fH6wbsCzALND39p07wD99+jQtNZXFsr89NT09DRhtBtVtfn5gRfRrTA6HQyaTP2losKtnNjfU18/OzgIuP3q0++pVbl4e4Lm5OQaDAZoArqio8Pb2/qiyEp0iKzMTXbKgSqVSw8PDYd0DXFZauqDVvqYngNipOCaYJTBLYIJZ4jWVvwVg70qAorrP+HtvD3aRKwwQHFhkiUaUy6jgUVOJSdOJRpl6hptGRO14xaurgMoRbVXkiIg2o1bUiLQY45E4gpoRBaqwCApEKjfIDXK7B7v9vfcXS5y0aWeww3beN7Dzvf/+7+/c9973/XmLzQsEDzwZeDLwwJOBJwMPPBl4MvDAk4EnAw//72SIjf2aYQJpOuj02TxGEETTy5ydt+bnVxrocoQGN+OHD+vc3bc6T7IvLT/gNT1WKBTQtOibbxWtLY2enjttbU0aGr5kfu692FEHhvXCz8VLBRS1NF9Z2dSraugeOPplVn5xXfKx68ofmqo6etV6/Qr/eIpaPDio419kel0wMKA2NvZtbjnVL6QF5OV7LiMdyUtH+F8kZCK2njp+7KZef563Da8FxowJTkhe0y9gBC/2nGK43WeGaECxyRF0CSlhYiPx5StFBrQ0g5GGtrZea+tgjT6j8cc5Yn5KzVJNNR0z3tn0X2Wi5k30fwTHjt30WTK7obPvVT6if4KT3pliT1FqWAiBgOHJMJKQmpoTEupd8bCeon/kX9jLrZ/WtLzy7k81mwZ1bEFBjZeXnCfDSIKZpXFaWt65c7msHeC4X8AwhcrGtPTQkKCjMtmb0jH/XAu+d51iq9YMGsrqDIYMa1bNLilt02jUsQf8+1TsK2JSqUhus4nmzFticqD7DEdCIGXOD7cyy3U6jZubHe8pjTCIRSZpaflWNiZq7SCUPvs3LCKFjRHS6ki5kbFYJrdIjP/G3EzKk2GEwdfXq7Hh75Hhi5+rtf/O86Oot13GWViaSiQSynDAYMggFDLu7s4LFu3/WefHwXLMp34HnzxJ4snwWqCo6I/XLudlXb5H/4tbRnBcbS2MZbKwmTMn29lZ8GR4XdDamhrsnxStOIvtpoe5rrASIrHgzTeM3zALEjJUbm6MYa3LwMhgZWWi0Zz/KjVbTC+N+v05IffuPlzYkuKaRfP2SOglIUG/rKn5E2VoYHjPG4RCQW/vqYqKI+VljT09XZpBLaVX/eHzSytD3tNo/nL4cChlgMC/PMlLAw8j/iv6TvYduZO8vq5eIjFSq9XjHB0rKyoFQsGgdlCr1bi6uZWVlpJYV4ZhuAzONu3t7TNmzkDbxsbGsWNfZIe5f++ew7hx5ubm+ffvC4UiuP/P2chZjaur63OVqq6uzsPDQ1lQYGJi6urmikHHTxiP3iqePKFpxsjISE/pZfb2tbW1AoFQpxtUqdSzfzG7rra2ubkZs5I7OVlZWRUqlU5vvWVjY9PU1FRbU0PTNMqrqqqmTZumLFCampq0traJRCKKCxBGzx0dHZMmT25rbWtoaMBYNjbWXV1dmJWjXC7jYn5HAEbk4ZHv8hX4DAoIxIIz/pqxKyICs/xtMBu/R6J0Kyoq6uvrP/rw162trdijmzduoHDr5i34TD9//lfz3if9FBcVfXv1asqRI0B0Ol1MVPSpk39OSmDjA0msLvn8W14ewfF7+vPY2DOnT/f39+fm5Bw6GPfh+x+wuXnbOzo7Ovx9fV82IbHApaWl5DI+7hAZccFH829kZV3IyCCRv0cOJ2Oq6HZN2OrLly4NX90XiUllpWXl5eUJ8fFYCEoiwyOufffdKApKPJl6aqan16xZs+xlsi8SE8F6WI+z80R8lZuTO2+ut5OTk52dHVgVzCgSChMTEgP8/MgP3atXrrh7eOi4AEU3d/evzpzNvJ4JhLuDrQsKCcamYI+iY2OGWWkhxGLx0iUQrJ3h4f4BARAyrXbwsy2bX1g8OLMMg/4xq7T0dJQ0NzX5fLxw0qRJx0+eQOGcd98lNbu7uk4cPz5+woTkoymZ169DzjBVNvZWr/944cKh3ljPeN2G9Wq1SqNWb9y0Sc/dXNwRvvNCxoVRJA1hoavYyH2vGfjc8tnmq1euElbFpWI7e7Ll6lVsBRIgXlVZlZWZCWTDunXZt7MhGd/f+j7005UoUSqVJY8exR08CHWB5qTt7shdr0hDcGAgwfv7+kh8fEtLy61bt4Bgr3t6esC5JBoeiug3i9g4XJ+Fi8iIJNb8g/fmDY9EJ4AOW1taCB7oH/CynEgSSgqVhfgDTmLuA/38ix48GEXPoqHca6pr3D1YFlY9f24kkbCR6+PHQ/N29/RoNRqwoXZwEJcODg5V1dUwGBCLzmed4FpzC3NTE5P6+gYXl8kqlaqvr6+3txempfzxY2g2iEVxUTH0tbWNTXVV1XRPz7t37k73nI5pS6XS7Nu3wdeoVsSdv+wxZQrMA+QPBsPM1PTRo0e2Y8eCEh3t7QwjAC9DWKUSSVlZGQmLB/FampthdSiO30F7W1tbIFhLT0+3i6srloOldXZ0oq1cLq+srITJcXN3Ky0p1WjUU6dNg9wQKzKKHNaB/gFI1/Bj5aihI+NQQg2dQQeVoufuwYEwEMZXKrzAaRq7DI7mOqGlxlKSnJ6oGjIQd1SJBBsxMDCAK5FYjJ4JzggExBFAD/gn3YIe8BaGD4dRhFxWAT2n6MRi8fA6oC7aGpEhuPpCEQvQS2zqAG4m6H9ksgeMjIn284uMjGTXPBSMv59LRwH9EBAYuJLLef8y7X3hgwdHUlJy8/JgV3G54pNPdu3e/bKf3Rze3d29dds2EphfXV2t2LGDHM+bn5+/Zu3avqHkFoFBQQqFQsWdHYBy9HM+PZ14BHv37n38+DFJuh8eEYGhYU6AL1u+PIDTaQCIxZmzZwkeExOzJyqqoKCAVaQKxfbt20neDhgezCSPTZOiv3btWlR09KFDrHn/+uLF6JiYkpKSUWSixxgbq9RqYsq8585NSkqScub3cHLy6dRUCwsLInOEy8Bi0EIDXH4W7umNlIThE9ur5qL+8RWsLqw6cCgK+Ffe3t7Ara2tnz59Shiwq7t7dVjYvn37wMW4nDNnTtSePbAQhLdgdeEpkCF279q1fMUKe3t7iktHIBAIyHDx8fE5OTkEh2ii2tSpU4Fv2LBh/fr1ZmZmnZ2dmzZuPLB//4kTJ1AOUXj27BmULXBXFxfMhOCj5ecb1hC6ciXZa6zc0dGRHNa0YP58UGLixIkvqmnZRwUQmoCAgITERLKb2BS0JRWgf0OCgyn2+FvdDoWisLAQODTy9m3bUrgzPcGz4Tt3QoAwlrmZ2cG4OBgA0jYjIwO4paUluVy2dGliUpJAKCRUIZ4Y4O0JExxkMigfyJCPjw/2G2YM5RAdNIfEvNQQQMBAEOu7d+/O5rJLQOMdiovLvnOHvd1bXPy7tWuzsrL4mxn8zQweeDLwZOCBJwNPBh54MvBk4IEnA08GHv6n8A8B2rsWsJqyvr/3uXQPqdxSFPHJvSuDBqmhIdc0r2siwjQq3egiSaFyFw3G+xq3ckk1xYyPcYkaSqJ0o4gU6Xa6n3M65/2ds9nO9H3jfZ/5HvPk/dbv6and2muv9V//9b/81j777EVW0QQEJCwREBB/ICAg/kBAQPyBgID4AwEB8QcCAuIPBATEHwgIPh14RAV/PWpqGjMzn5eVvcnOLn38+Ol6X6chIw1c/rbXyEhnjJVxf8NeJiZ99PW1iaKIP/zHQiBo2bc3ZfuO1IaGBopq19DQGjZCL/t+bVtrleuqVpFIciej7FZaWW5eZcWr6vLyN/LN5JU9PW09vWbp9+1OFPgXQUrwiZFw8a6GxkKKmtOlq/OOyISq6oZWqVQkleY9q6IoR4qacPjordwnbynKgaImnbog+8JpC34kkrjz6YMGu1PUXIqaHRWVKBSKiTLJS6M/Yzx+/GrMWO8GQdtEm2Hxcd5qWhpVdS0cjuzbsbKvI3I4Ol1VcSxoFraJxDpd1XBc19jWKhQzr4CXSKQa6spd+Txvn2N7dqagIC7OZ/78sUSxnw7EHz5R1qUCA+PCw+O1tLVu3wkzMOpRJWjm/qnvVkukUnVlvjKHYzMp5F7GY2vrkVevBvF45EYIub/0+cDX90x4+KlR5ibPXxzU0tOqaWzl/tkXDXBoukUorm0RZqSHrVgz4+bN7EmTNos+n5cxE3/4/47U1Nzo6PPa2n0vJHu30ZTwo2/3/XfzOE1VNLTs27fUevIXaWn3wyOSiZ7J/aXPAE1NwsNHLkmlQp+NMw17dW1ol6jwP/4qcboRKwZRezdNlX9550OFwwmPmDveKufokSuuKyb16dOVKJysHzo1iotfDxrkI3+Tskj+8zHlU7QqTdcfPxEwxnrwEKO1spfOSsTyq+iPpnR4jujCBZ/Zs82Iwkl+6NQwNu4plR5XLAHTrxO30wpbdiEEqfM41TVNQ43962qalfg8DofmcpTFkqYrV0OnTB5c0y5RdAjZjSY+V7lDuiC6JuuHzo/2dsnq1QdpejpNz6dpG5o2s7TyUKc4bc3CRkHr+58WgVDc2Cr6fW6WuYCwXdJIUY31bM3W+vrWbnyun/cRmh4ub3AWTc8zMlzV0iwk2ib+0NnB5XJcXaerqnZRV9fILzollWb9envX64YWkVgiM/j3P/9ii1mFmlwO9aKmKTh8mUT6qLntipnFcIpqjYpeoaamRLRN/OEzgKmp/smT65uaai3MN+TkvcIajaIo+v+wyTKHptuE4gZhu6Xlxqx7ud7e38yebU70TPzhswFWuhkZUY2ChlHD1sXuSe2npSal/yTjb5dI9bXU8rJKemk55+YUbdvmEhm5iKZpomTiD58TrKwGtLSccnS09F1/XEV14c9nb+t1U8PSWfLv3dDDGprD5eCSZ7llBv3cbCeGaGurvan6h5/fDKJb4g+fJVRU+PHxPtXVx5a7TFzpGsuj51ub+aTGpVHNQh0lnpamqvwxJQX3oKWqKnwNilKnqQcZ+QtnhnPp+ZO+DNXX0y0t3f+iLFZXR5No9ZOCfP7w16Gk5PX+/ZfPnLlbUVFFUWKKwoJYi6Lq4856mY8zHjbIp6URtVooCn9oDkdj4UJLHx+H4cMNiOqIP/yHo71dIhC0FBVVlpa+trAcqNOjS0rSfX19bWPjnjo6mjwel6iI+AMBAVk/EBB0GnSu5zV+vvxzdGRkX339pqYmZSUl/4CNwYFBL1+8mGBt3b1798SLFzU1NbdGhOsbGDgvXkLTtIWl5a2bNzkcztChQ3F5Xl6eh5fXvbt3H2Rn6+jo5OfnDxs+rLa2TkVFRUurW+a9TD09ve2Rkdn37+/etUu2/anzUrfVqynZF5pr5sycZWZuFr1rl6I8IpEoLDQ0Iz2jT58+goYGW1vbcRPGu7osHzV6VGFhkRKfP9B4YGFBobm5edb9LJFQNHTY0KxM2UaYe/fve/q0ZFt4eEVFxejRoyN2bK+qqtro5//y5cslS5euXrsmcvuOny9fNujXT7ZXYWPjrDmzMeSLCQmDBg1CC8bGxuj9+fPn/zVkyMOcHB1d3c2hoRDP22t92q1bVmOsaJqTkZ7eq1evblrdCvIL7L+2DwwOTk1J2bt7j0AgsLCwwPqjpKTExsbGw8tzg5//o4cPe/XuXVlRMcPBwW3NamZ0abfSwsPCMHZT2W62WWh27rx5e3bvKX/5cviIEYe+j4Vsbq4ri4qKbKbY/Jbxm6Gh4cvyl02NTaNGj4aSA4ODvp4+He0kJyXt2LYdusJ0BG0K7tGjx3pPz6LCog9TUFOr2UUTaklNSYUY/fv3y8vNw/TNdZy3ys2tczlEp/q23rbwCCtzi7DQLZjLG9evMzuSrnN3d1/7LQ4itobjbPqd9CfFxQucvmE28AsODPRc51FZWZl9PzspMZHZLxC/cx89mmpnl5eby5SUl5fPnD7j/NlzFa9ewUb9ff38vH2YTpmNgDGj1uPG//3YMUV50Kz9V1O/njot7vSZF2Vld27fFovFLS0tOOXl4REashkHwrY2tBAVGbnK1fXZs2cQfqyl1c0bN3Dqyi+/QGBmC0DZvoP3Mjf6b6iprplm95XHd+vYXgT1gkupqc1NTRIJFhWCL6zGwFJRjhJ0amczJeWnFKZmbW3tGjc31EGnixcuOngg5uHDh/PnOU6fZs/0cuTwYQwTYhcWFJw/dx4lVW/eQA/o8Wx8fHFRcVZmpuIAT504idHhAB1BVGb40PPc2XOgfAiAuANNopDRdnRUFDwEBzjL6JkBho8ZYTTDTsGjh/IpkO9uCJkbGxshxvG//4Op8+bNG5uJk3y9vTuVBXYuvoQwfPN2muN8xz27dvl6+8CeUBgQFIQpWbRgAV+Jj4C0PSJi86YQL29vNfmOjJT8o18kEyUlfteuXd9WVTHlWBaxT0VoaGjIPsCiaR6Pp6ysoqykLNtD+f2NTngUAmdZWRkCGywMgZCVB0b2nYdHQlKiiqqq64oV0VHRsF1md2b2EzG+kpJss3GJFH8L8vMvX7683scbCY2JNfgN22VqNjQIZDuQcjm4gNnHkAFiJyK0qpqarE2F1RxTIhSJxKJ3z8niAHaJQons66ZIEvT1a7/WVFdH7Yzu0qUL2yO0weXx1NXV6+rqYHZr1q5NTE6CkGtXr4YPNwgaPtADHq9eINiyeXPcmbh9MQeWOjuj0Nffr3fv3sudl3ms85g8ZcrQYcNQyGqb+aQdORla/f1S9MNaNOFCwtu3b9E4OwVI7IzO2TqC+nr4D4Qk6+k/xI7t2wse5yPXIzINGDgwIDCA2YYUPGpXdPTxkyc0NTScHOfPnjNn2XIXlH8fG5uUmMTjcnV1dfFvRWXlPMd5zsuWITqGBG/ClPTs1dN/w8YBAwe4r10L+tG9u3bwpuAHDx6cPnUa9YcMGfLq1avampo1366dPmMGOAPoWXNz8/gJEzZvCcX8FRcXH4qJQbrHZCPCOX3jNM/REeVbNofeuXOby+HaT/8a1nbixx/PnD4jaW+faj9t+YoVoSEh9+/fNzU1DZXvDJ+cmNRdWxvco2fPngFBgdra2kKhEI4Hb9fS0lLXUNfR0V3v7a3VXQvMMDgoGKFaW0cbRG7ipEkMq8HYYY4wLzTi6+8Ptha4MeDub79pduni/p07yNUat9XwNHMLC+TDhsaGvnqy3VOrq6tHm452XbkyKDCI2WsY7u2y3IUhOQCS2O6du+BgoEOeXl58pQ8PRCHjwR/Ai3z8fNnC2EOHkpOS4ZPQD3xeVfXd9zriz8SdPHGiTShEOONyOEi/tnZ20x1mBG7YyE6ByVAT6BYyd+vWDWELJE1VTXXlqlXWX35J/OEPsSkoWL6VNg/2J2wTYhbfrfo5XBS2tcme6FRWVkLElEja5eGNz/39rUmQeJxC5FRSVlIokeAqJrChWS7AXMWMnabbxe1isUjWi5JsF28Ee6GwTX4GQRjuicTCB0MQid49UopUQMs/S2MuZMWQtEtQR9Y8n4/G5QJL+Xwl5ASma3ZEssTCl+32i5K29wlEUWy0y+YQeAKzSy1sEWIoCsCUvOtClhN/9xyHvJF2Llc2ig5DUGxWLraowyPkaBOaZLp7X//dMOX6EbL12XZYQCq43x9NAQNoA0zT+suJ0+ynEX/433Hv3j2GeiKIjho1iikEk0HSx5qVWWJi5hR3esaE3b13D/kEZjts6FBwHqb89evXuGr48OEs8yksLBwxYgTYDlj4ixcvcIrhPIiFyBjN4L4SCVaozNIcQJ2S0lJ0R8se0TNFLKfkOzVnZmaCCuN48ODBzK7YDCDb06dPMeWDBw1SLM/KysKgsFBG+OwwXmQnrFYxBIjNigpAwuwHDyAPlqQjR45ky0EwsGAwMTEB/UBcf/LkCaTlyW3xcX4+lkZgjfAACIklNcOgKl+/LiosxCjU1NXNzcz4fL6iAOnp6dBJB9IiU+ndu8iT8GozU1OGF6Xdvg37lW1ALxJBh2ifbar02bPSkhIcGBoZGfbvz7aDBIXFA/ieqoqKmZkZwzPZiUa+hUijRo5k8wxZT3fEypUrkW07FJ49e3a+k5PL8uWwqlOnT+/Zu5c9dfr0aVDeqqqq/9nUpUuX/DdsYP999OjR3xYsANt5lCsDltPs4q+0tPRbd3eYZocWYr//ft++fR0K4VfoEc6GjL9o8WI4ElMOn3SYORP8qkP9a9euea1fHx8fD1rFLEkZwOb8/f23hIUx9wxkbEahX3d3d5g1jq9evbp4yRJWJxB1ydKloItpaWlwV5Ac2Jxim+s8PDIyMhQFQNdhW7fi4IcffkCziqf2HzgAVgaqBtNnC7H+gaLKy8uZfxUFw6hXubmxp2T3EoRCjI6dkQMxMWgNhcy/KampAYGBODh/4cIyFxf2qh07dvj5+7P6J+vpjyHn4UMEVFiAIpedPHny1rAwTMb1X39VDDOVlZWIxAiisObo6OiAgIA/SneYJP2+fX88fvzIkSO7d+9WDJPIEjC+Bzk56BfRlC0Hmal6+zYnBxI9ZGmDnD5xbt26FRgUZGtrywZvC3PzxIsXcRAUHAwxmPqQHDX76unBCZEcIrZtO3z48DtGIRY3NDYiw3Dk791QfF4V7m1oaIjecWxgYIAKWBazkRv8+9TJk79cuRK8aRNHjg8sBfwKXiGRKA4cTAY+jJjy31evBgYGsuU//fTTzZs3EZtB8aN37pS8vwpZtYeuLvIkO17F9hkPUZwapErm7jDQv39/xCwUvuNRXC7OJiQkoPfgoCD2Kh8fn20REVhiwbeTkzvXixG4ISEhnUeavMePYX/Z2dm1dXXI1MxkwCjBfy0tLWfNnInU3Kd3b6yDmfpjxozRUFeHicM+sJ6znTLFyMiItSpkaqTpd3xJIMMYK6upU6eCr8OwcC1jTDguKi6G0T/Izm5pbWVNHC0UFBRg2iAPGBooHFMZvMje3t7JyenqtWswJtg0ysGUIqOiYGFwTmdnZ4ZcyW5nqaiAe8BEBgwYoKujU11TYzp6NLwR5m5nZ4f2jx49mpKSAk7IEELAesIEWF5MTExScrKgvt7T0xNewZxCIEeQtrKyspk8GXGhvq5u3LhxrG/DUovBoExMmLsL7yhZRYWysvLCBQtGjhhx7NgxSAv+g3Bz/caNTcHBMx0cZs2alV9QIEK80NdHfQwfB4diY8+dO3f7zh2wOJZNIaZg7KbvGZR8Laf8lZ0dpuzI4cNILD169vTy9GTvRMG1INKiRYu+GDsWw4S3wJlRnpiYGHPwIGLE+HHjHBwceLxO9CEYeV6DgIA8r0FAQPyBgID4AwEB8QcCAuIPBATEHwgIiD8QEBB/ICAg/kBA8Ffgn2wfD1QmqYYIAAAAAElFTkSuQmCC';

// =====================================================
// EMPLOYEE DATABASE & APP STATE
// =====================================================
const EMPLOYEES = [
  {code:'MD001',name:'Selvam',dept:'Admin',designation:'Managing Director',salary:0,bank:'',accNo:'',role:'MD',phone:'',doj:'',email:'selvam@swethastructures.com'},
  {code:'HR001',name:'HR Admin',dept:'Admin',designation:'HR Admin',salary:0,bank:'',accNo:'',role:'HR',phone:'',doj:'',email:''},
  {code:'SS001',name:'Sankar Guru P',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'sankarguru182@gmail.com'},
  {code:'SS002',name:'Vishnukumar M',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'vishnum991@gmail.com'},
  {code:'SS003',name:'Hariharan N',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'hariharan0335@gmail.com'},
  {code:'SS004',name:'Priyanka S',dept:'QS',designation:'Quantity Surveyor',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'priyankaskcivil@gmail.com'},
  {code:'SS005',name:'Vellaisamy Sankar',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'vellaisamysankar88@yahoo.com'},
  {code:'SS006',name:'Srinivasan',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'lsssrinisan@gmail.com'},
  {code:'SS007',name:'Balasubramanian N',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'baluvspl@gmail.com'},
  {code:'SS008',name:'Santhosh J',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'santhosej0210@gmail.com'},
  {code:'SS009',name:'Hariharan G',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'josephharigmw@gmail.com'},
  {code:'SS010',name:'M Karthikeyan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'karthikmanoharan19@gmail.com'},
  {code:'SS011',name:'Govindaraj R',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'govindganga0208@gmail.com'},
  {code:'SS012',name:'Kamalesh Velusamy',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'vkamaleshkamalesh60306@gmail.com'},
  {code:'SS013',name:'Santhoshkumar G',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'santhoshganesan0556@gmail.com'},
  {code:'SS014',name:'Nithyaprabhu A',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'nithyaprabhu00@gmail.com'},
  {code:'SS015',name:'Yuvaraj M',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'yuvamarimuthu1085@gmail.com'},
  {code:'SS016',name:'S Sankavai',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'sankavaisanthosh@gmail.com'},
  {code:'SS017',name:'Kousikraja M',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'kousik622@gmail.com'},
  {code:'SS018',name:'Rajkumar R',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'Rajthelegend4058@gmail.com'},
  {code:'SS019',name:'Sakthikumar S',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'sakthikumar250289@gmail.com'},
  {code:'SS020',name:'Shanmugasundaran G',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'shanmugashanmuga90@gmail.com'},
  {code:'SS021',name:'Govarthan S',dept:'Admin',designation:'Admin',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'govarthansakthi@gmail.com'},
  {code:'SS022',name:'Devendaran Arivalagan',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'devendaran96@gmail.com'},
  {code:'SS023',name:'Gowtham S',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'gowthamautomech1995@gmail.com'},
  {code:'SS024',name:'Manikandan M',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'manikandansurya914@gmail.com'},
  {code:'SS025',name:'Karthikeyan A',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'karthikabk28@gmail.com'},
  {code:'SS026',name:'Krishna Gowri Sankar',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'krishnagowrisankar1@gmail.com'},
  {code:'SS027',name:'Mahaganapathi Ponnusamy',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'Mahaganapathi529717@gmail.com'},
  {code:'SS028',name:'Dinesh Jayabal',dept:'Admin',designation:'Driver',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'dineshindira2024@gmail.com'},
  {code:'SS029',name:'Depsingh R',dept:'Admin',designation:'Security',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'depsinghrokaya@gmail.com'},
  {code:'SS030',name:'Kathirvel N',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'kathirveln2588@gmail.com'},
  {code:'SS031',name:'Shiyam Raj E',dept:'Accounts',designation:'Accounts',salary:0,bank:'',accNo:'',role:'Accounts',phone:'',doj:'',email:'shiyam0905@gmail.com'},
  {code:'SS032',name:'Dharmaraj',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'thedharmarajm@gmail.com'},
  {code:'SS033',name:'Sakthi Murugan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'sakthi252636@gmail.com'},
  {code:'SS034',name:'Praveen Kumar J',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'forpraveenvideos@gmail.com'},
  {code:'SS035',name:'Dinesh',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'Dineshvj5315@gmail.com'},
  {code:'SS036',name:'Lingeswaran Subramanian',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'linges1993@gmail.com'},
  {code:'SS037',name:'Udhayasankar',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'udhayask14@gmail.com'},
  {code:'SS038',name:'Manikam',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'mkguys2010@gmail.com'},
  {code:'SS039',name:'Sarath',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'sarathcivil42@gmail.com'},
  {code:'SS040',name:'Marimuthu',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'marimuthu04071990@gmail.com'},
  {code:'SS041',name:'Arunkumar',dept:'QS',designation:'Quantity Surveyor',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'aruntec16@gmail.com'},
  {code:'SS042',name:'Mohan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:'',email:'perumalmohan666@gmail.com'}
];

let departments = ['Design','Marketing','Execution','Production','QS','Admin','Accounts'];
let departmentData = []; // [{id, name}] — full dept objects from DB
let currentUser = null;
let wizardStep = 1;
let originalSalaryHTML = '';
let leaveApplications = [];
let leaveBalances = {};
// Public holidays — { 'YYYY-MM-DD': { id, name, description } }
let publicHolidays = {};
let publicHolidaysList = [];
let selectedLeaveType = 'casual';
let NOTIF_HISTORY = [];
let notifPrefs = { salary: true, leave: true, advance: true, payroll: true, expense: true, exit: true, celebration: true, compliance: true, announcement: true, asset: true };
let leaveNextId = 1;

// =====================================================
// F11: DOB MAP (month/day for all 44 employees)
// =====================================================
const EMP_DOB_MAP = {
  'MD001':'1975-03-11','HR001':'1985-01-15',
  'SS001':'1986-08-19','SS002':'1989-10-03','SS003':'1985-07-04','SS004':'1991-04-25','SS005':'1984-05-07',
  'SS006':'1988-11-22','SS007':'1983-10-12','SS008':'1995-02-14','SS009':'1990-06-15','SS010':'1992-03-17',
  'SS011':'1993-12-08','SS012':'1998-08-05','SS013':'1993-07-27','SS014':'1991-09-01','SS015':'1995-06-22',
  'SS016':'1994-09-30','SS017':'1997-01-09','SS018':'1990-12-10','SS019':'1993-04-19','SS020':'1985-03-28',
  'SS021':'1990-02-28','SS022':'1996-02-11','SS023':'1995-10-16','SS024':'1992-08-22','SS025':'1992-05-24',
  'SS026':'1984-06-03','SS027':'1988-01-31','SS028':'1987-11-15','SS029':'1980-07-15','SS030':'1994-05-20',
  'SS031':'1997-07-30','SS032':'1996-06-09','SS033':'1994-01-25','SS034':'1988-04-14','SS035':'1999-04-02',
  'SS036':'1996-03-11','SS037':'1997-06-18','SS038':'1982-12-20','SS039':'1998-09-14','SS040':'1979-09-05',
  'SS041':'1994-08-13','SS042':'1990-05-24'
};
EMPLOYEES.forEach(e => { if (EMP_DOB_MAP[e.code]) e.dob = EMP_DOB_MAP[e.code]; });

// =====================================================
// NEW FEATURE DATA STRUCTURES
// =====================================================

// F1: Shift Management
let SHIFT_TYPES = [
  {code:'GEN', name:'General Shift', start:'09:00', end:'18:00', color:'#2563EB'},
  {code:'2ND', name:'Second Shift', start:'14:00', end:'22:00', color:'#D97706'},
  {code:'3RD', name:'Third Shift (Night)', start:'22:00', end:'06:00', color:'#7C3AED'}
];
let shiftAssignments = {};
const SHIFT_ELIGIBLE_DEPTS = ['Production'];

// F2: Expense Reimbursement
const EXPENSE_CATEGORIES = ['Travel','Food','Accommodation','Equipment','Office Supplies','Medical','Fuel','Other'];
let expenseReimbursements = [];
let expReimbNextId = 1;

// =====================================================
// ROLE-SPECIFIC NAVIGATION CONFIG
// =====================================================
let _activeNavId = 'home';
let _navExpandedGroups = {};
let _lastNavWidth = 0;

const NAV_ICONS = {
  home:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  attendance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>',
  advance:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  performance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',

  tax:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  salary:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  expense:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><rect x="9" y="12" width="6" height="8"/></svg>',
  recruit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
  profile:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z"/></svg>',
  admin:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
  logout:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  ta:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  store:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M9 21V13h6v8"/><path d="M3 9h18"/></svg>',
  purchase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  more:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>'
};

const NAV_CONFIG = {
  MD: [
    { id:'home', label:'Home', icon:'home', action:{type:'tab',target:'home'} },
    { id:'md-attendance', label:'Attendance', icon:'attendance', children:[
      { id:'md-att-report', label:'Employee Attendance', action:{type:'tab',target:'attendance'} },
      { id:'md-att-leave', label:'Employee Leave Request', action:{type:'tab',target:'leaves'} }
    ]},
    { id:'md-advance', label:'Advance & Expense', icon:'advance', action:{type:'overlay',target:'advance-requests'} },
    { id:'md-location', label:'Live Location', icon:'location', action:{type:'overlay',target:'location'} },
    { id:'md-progress', label:'Progress', icon:'progress', action:{type:'tab',target:'progress'} },
    { id:'md-performance', label:'Employee Performance', icon:'performance', children:[
      { id:'md-perf-track', label:'Performance Review', action:{type:'overlay',target:'hr-kpi'} },
      { id:'md-perf-onboard', label:'Add Employee', action:{type:'overlay',target:'onboarding'} }
    ]},
    { id:'md-tax', label:'Form 16 & Tax', icon:'tax', action:{type:'overlay',target:'hr-tax'} },
    { id:'md-salary', label:'Salary', icon:'salary', children:[
      { id:'md-sal-structure', label:'Salary Structure', action:{type:'tab',target:'salary'} },
      { id:'md-sal-check', label:'Salary Check', action:{type:'tab',target:'salary'} }
    ]},
    { id:'md-peb-dash', label:'PEB Dashboard', icon:'store', action:{type:'overlay',target:'peb'} },
    { id:'md-inventory', label:'Inventory', icon:'store', children:[
      { id:'md-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'md-inv-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'md-inv-requests', label:'Material Requests', action:{type:'overlay',target:'peb'} },
      { id:'md-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'md-procurement', label:'Procurement', icon:'purchase', children:[
      { id:'md-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'md-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'md-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'md-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'md-stock-outlet', label:'Stock Outlet', icon:'store', children:[
      { id:'md-so-approved', label:'Approved Requests', action:{type:'overlay',target:'peb'} },
      { id:'md-so-factory', label:'Factory Issue Log', action:{type:'overlay',target:'peb'} }
    ]},
    // Footer items
    { id:'md-profile', label:'Profile', icon:'profile', action:{type:'overlay',target:'profile'}, isFooter:true },
    { id:'md-admin', label:'Admin Panel', icon:'admin', action:{type:'overlay',target:'admin'}, isFooter:true },
    { id:'md-superadmin', label:'Access Control', icon:'shield', action:{type:'overlay',target:'superadmin'}, isFooter:true, superAdminOnly:true },
    { id:'md-settings', label:'Settings', icon:'settings', action:{type:'overlay',target:'settings'}, isFooter:true },
    { id:'md-logout', label:'Log Out', icon:'logout', action:{type:'logout'}, isFooter:true, isDanger:true }
  ],
  HR: [
    { id:'home', label:'Home', icon:'home', action:{type:'tab',target:'home'} },
    { id:'hr-attendance', label:'Attendance', icon:'attendance', children:[
      { id:'hr-att-self', label:'Self Calendar', action:{type:'tab',target:'attendance'} },
      { id:'hr-att-leave', label:'Apply Leave', action:{type:'tab',target:'leaves'} },
      { id:'hr-att-emp', label:'Employee Attendance', action:{type:'tab',target:'attendance'} },
      { id:'hr-att-leavereq', label:'Employee Leave Req', action:{type:'tab',target:'leaves'} }
    ]},
    { id:'hr-advance', label:'Advance', icon:'advance', children:[
      { id:'hr-adv-salary', label:'Salary Advance', action:{type:'tab',target:'advance'} },
      { id:'hr-adv-requests', label:'Approve Requests', action:{type:'overlay',target:'advance-requests'} }
    ]},
    { id:'hr-performance', label:'Employee Performance', icon:'performance', children:[
      { id:'hr-perf-track', label:'Performance Review', action:{type:'overlay',target:'hr-kpi'} },
      { id:'hr-perf-onboard', label:'Add Employee', action:{type:'overlay',target:'onboarding'} }
    ]},
    { id:'hr-recruit', label:'Interview Process', icon:'recruit', children:[
      { id:'hr-rec-positions', label:'Open Positions', action:{type:'overlay',target:'hr-recruit'} },
      { id:'hr-rec-pipeline', label:'Candidates', action:{type:'overlay',target:'hr-recruit'} }
    ]},
    { id:'hr-tax', label:'Form 16 & Tax', icon:'tax', action:{type:'overlay',target:'hr-tax'} },
    { id:'hr-salary', label:'Salary', icon:'salary', children:[
      { id:'hr-sal-self', label:'Self Salary', action:{type:'tab',target:'salary'} },
      { id:'hr-sal-list', label:'Employee List', action:{type:'tab',target:'salary'} }
    ]},
    { id:'hr-peb-dash', label:'PEB Dashboard', icon:'store', action:{type:'overlay',target:'peb'} },
    { id:'hr-inventory', label:'Inventory', icon:'store', children:[
      { id:'hr-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'hr-inv-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'hr-inv-requests', label:'Material Requests', action:{type:'overlay',target:'peb'} },
      { id:'hr-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'hr-procurement', label:'Procurement', icon:'purchase', children:[
      { id:'hr-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'hr-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'hr-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'hr-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'hr-stock-outlet', label:'Stock Outlet', icon:'store', children:[
      { id:'hr-so-approved', label:'Approved Requests', action:{type:'overlay',target:'peb'} },
      { id:'hr-so-factory', label:'Factory Issue Log', action:{type:'overlay',target:'peb'} }
    ]},
    // Footer
    { id:'hr-profile', label:'Profile', icon:'profile', action:{type:'overlay',target:'profile'}, isFooter:true },
    { id:'hr-admin', label:'Admin Panel', icon:'admin', action:{type:'overlay',target:'admin'}, isFooter:true },
    { id:'hr-settings', label:'Settings', icon:'settings', action:{type:'overlay',target:'settings'}, isFooter:true },
    { id:'hr-logout', label:'Log Out', icon:'logout', action:{type:'logout'}, isFooter:true, isDanger:true }
  ],
  Employee: [
    { id:'home', label:'Home', icon:'home', action:{type:'tab',target:'home'} },
    { id:'emp-attendance', label:'Attendance', icon:'attendance', children:[
      { id:'emp-att-cal', label:'Calendar', action:{type:'tab',target:'attendance'} },
      { id:'emp-att-leave', label:'Apply Leave', action:{type:'tab',target:'leaves'} }
    ]},
    { id:'emp-advance', label:'Advance', icon:'advance', children:[
      { id:'emp-adv-site', label:'Site Advance', action:{type:'tab',target:'site'} },
      { id:'emp-adv-salary', label:'Salary Advance', action:{type:'tab',target:'advance'} },
      { id:'emp-adv-travel', label:'Travel Advance', action:{type:'tab',target:'ta'} }
    ]},
    { id:'emp-expense', label:'Expense', icon:'expense', children:[
      { id:'emp-exp-site', label:'Site Expense', action:{type:'tab',target:'site-expense'} },
      { id:'emp-exp-travel', label:'Travel Expense', action:{type:'tab',target:'travel-expense'} }
    ]},
    { id:'emp-progress', label:'Project Progress', icon:'progress', action:{type:'tab',target:'progress'} },
    { id:'emp-salary', label:'Salary Statement', icon:'salary', action:{type:'tab',target:'salary'} },
    { id:'emp-store', label:'Store', icon:'store', deptOnly:['Site Engineer'], children:[
      { id:'emp-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'emp-inv-requests', label:'Material Request', action:{type:'overlay',target:'peb'} },
      { id:'emp-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} },
      { id:'emp-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'emp-acc-payments', label:'Payments', icon:'salary', deptOnly:['Accounts'], children:[
      { id:'emp-acc-approved-adv', label:'Approved Advances', action:{type:'overlay',target:'accounts-payments'} },
      { id:'emp-acc-approved-exp', label:'Approved Expenses', action:{type:'overlay',target:'accounts-payments'} },
      { id:'emp-acc-settlement', label:'Settlement Tracker', action:{type:'overlay',target:'accounts-payments'} }
    ]},
    { id:'emp-acc-salary', label:'All Salary', icon:'salary', deptOnly:['Accounts'], action:{type:'tab',target:'salary'} },
    { id:'emp-acc-procurement', label:'Procurement', icon:'store', deptOnly:['Accounts'], children:[
      { id:'emp-acc-proc-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'emp-acc-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'emp-acc-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'emp-acc-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'emp-acc-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'emp-admin-peb', label:'PEB Management', icon:'store', deptOnly:['Admin'], children:[
      { id:'emp-adm-peb-dash', label:'PEB Dashboard', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-inv-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-inv-requests', label:'Material Requests', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-so-approved', label:'Stock Outlet — Approved Requests', action:{type:'overlay',target:'peb'} },
      { id:'emp-adm-so-factory', label:'Stock Outlet — Factory Issue', action:{type:'overlay',target:'peb'} }
    ]},
    // Footer
    { id:'emp-profile', label:'Profile', icon:'profile', action:{type:'overlay',target:'profile'}, isFooter:true },
    { id:'emp-settings', label:'Settings', icon:'settings', action:{type:'overlay',target:'settings'}, isFooter:true },
    { id:'emp-logout', label:'Log Out', icon:'logout', action:{type:'logout'}, isFooter:true, isDanger:true }
  ],
  Manager: [
    { id:'home', label:'Home', icon:'home', action:{type:'tab',target:'home'} },
    { id:'mgr-attendance', label:'Attendance', icon:'attendance', children:[
      { id:'mgr-att-self', label:'Self Calendar', action:{type:'tab',target:'attendance'} },
      { id:'mgr-att-leave', label:'Apply Leave', action:{type:'tab',target:'leaves'} },
      { id:'mgr-att-emp', label:'Employee Attendance', action:{type:'tab',target:'attendance'} },
      { id:'mgr-att-leavereq', label:'Employee Leave Req', action:{type:'tab',target:'leaves'} }
    ]},
    { id:'mgr-advance', label:'Advance', icon:'advance', children:[
      { id:'mgr-adv-salary', label:'Salary Advance', action:{type:'tab',target:'advance'} },
      { id:'mgr-adv-requests', label:'Approve Requests', action:{type:'overlay',target:'advance-requests'} }
    ]},
    { id:'mgr-performance', label:'Employee Performance', icon:'performance', children:[
      { id:'mgr-perf-track', label:'Performance Review', action:{type:'overlay',target:'hr-kpi'} }
    ]},
    { id:'mgr-salary', label:'Salary', icon:'salary', children:[
      { id:'mgr-sal-self', label:'Self Salary', action:{type:'tab',target:'salary'} },
      { id:'mgr-sal-list', label:'Employee List', action:{type:'tab',target:'salary'} }
    ]},
    { id:'mgr-progress', label:'Progress', icon:'progress', action:{type:'tab',target:'progress'} },
    { id:'mgr-store', label:'Store', icon:'store', deptOnly:['Site Engineer'], children:[
      { id:'mgr-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'mgr-inv-requests', label:'Material Request', action:{type:'overlay',target:'peb'} },
      { id:'mgr-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} },
      { id:'mgr-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    { id:'mgr-admin-peb', label:'PEB Management', icon:'store', deptOnly:['Admin'], children:[
      { id:'mgr-adm-peb-dash', label:'PEB Dashboard', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-inv-stock', label:'Stock Items', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-inv-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-inv-requests', label:'Material Requests', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-inv-returns', label:'Returns & Scrap', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-so-approved', label:'Stock Outlet — Approved Requests', action:{type:'overlay',target:'peb'} },
      { id:'mgr-adm-so-factory', label:'Stock Outlet — Factory Issue', action:{type:'overlay',target:'peb'} }
    ]},
    // Footer
    { id:'mgr-profile', label:'Profile', icon:'profile', action:{type:'overlay',target:'profile'}, isFooter:true },
    { id:'mgr-settings', label:'Settings', icon:'settings', action:{type:'overlay',target:'settings'}, isFooter:true },
    { id:'mgr-logout', label:'Log Out', icon:'logout', action:{type:'logout'}, isFooter:true, isDanger:true }
  ],
  Accounts: [
    { id:'home', label:'Home', icon:'home', action:{type:'tab',target:'home'} },
    { id:'acc-attendance', label:'Attendance', icon:'attendance', children:[
      { id:'acc-att-cal', label:'Calendar', action:{type:'tab',target:'attendance'} },
      { id:'acc-att-leave', label:'Apply Leave', action:{type:'tab',target:'leaves'} }
    ]},
    { id:'acc-advance', label:'Advance', icon:'advance', children:[
      { id:'acc-adv-site', label:'Site Advance', action:{type:'tab',target:'site'} },
      { id:'acc-adv-salary', label:'Salary Advance', action:{type:'tab',target:'advance'} },
      { id:'acc-adv-travel', label:'Travel Advance', action:{type:'tab',target:'ta'} },
      { id:'acc-adv-requests', label:'Approve Requests', action:{type:'overlay',target:'advance-requests'} }
    ]},
    { id:'acc-expense', label:'Expense', icon:'expense', children:[
      { id:'acc-exp-site', label:'Site Expense', action:{type:'tab',target:'site-expense'} },
      { id:'acc-exp-travel', label:'Travel Expense', action:{type:'tab',target:'travel-expense'} },
      { id:'acc-exp-all', label:'All Expense Requests', action:{type:'overlay',target:'hr-expenses'} }
    ]},
    { id:'acc-payments', label:'Payments', icon:'salary', children:[
      { id:'acc-approved-adv', label:'Approved Advances', action:{type:'overlay',target:'accounts-payments'} },
      { id:'acc-approved-exp', label:'Approved Expenses', action:{type:'overlay',target:'accounts-payments'} },
      { id:'acc-settlement', label:'Settlement Tracker', action:{type:'overlay',target:'accounts-payments'} }
    ]},
    { id:'acc-salary', label:'Salary', icon:'salary', children:[
      { id:'acc-sal-self', label:'Self Salary', action:{type:'tab',target:'salary'} },
      { id:'acc-sal-list', label:'Employee List', action:{type:'tab',target:'salary'} }
    ]},
    { id:'acc-progress', label:'Project Progress', icon:'progress', action:{type:'tab',target:'progress'} },
    { id:'acc-procurement', label:'Procurement', icon:'purchase', children:[
      { id:'acc-proc-grn', label:'GRN', action:{type:'overlay',target:'peb'} },
      { id:'acc-proc-vendors', label:'Vendors', action:{type:'overlay',target:'peb'} },
      { id:'acc-proc-indents', label:'Purchase Indents', action:{type:'overlay',target:'peb'} },
      { id:'acc-proc-orders', label:'Purchase Orders', action:{type:'overlay',target:'peb'} },
      { id:'acc-proc-transport', label:'Transport', action:{type:'overlay',target:'peb'} }
    ]},
    // Footer
    { id:'acc-profile', label:'Profile', icon:'profile', action:{type:'overlay',target:'profile'}, isFooter:true },
    { id:'acc-settings', label:'Settings', icon:'settings', action:{type:'overlay',target:'settings'}, isFooter:true },
    { id:'acc-logout', label:'Log Out', icon:'logout', action:{type:'logout'}, isFooter:true, isDanger:true }
  ]
};

// F3: Self Service
// employeeSelfData removed — using EMPLOYEES array directly via ensureSelfData()

// F4: Geo-fenced Attendance
const SITE_LOCATIONS = [];
let siteLocations = [];

// F5: Tax / Form 16
let taxDeclarations = {};
const TAX_SLABS_OLD = [
  {min:0, max:250000, rate:0},
  {min:250000, max:500000, rate:5},
  {min:500000, max:1000000, rate:20},
  {min:1000000, max:Infinity, rate:30}
];
const TAX_LIMITS = { sec80C: 150000, sec80D: 25000, stdDeduction: 50000, hra: 0 };

// F6: Compliance
let complianceFilings = [];
let complianceNextId = 1;
let contractWorkers = [];
let contractWorkerNextId = 1;
const COMPLIANCE_TYPES = [
  {code:'PF', name:'PF Monthly Return', frequency:'Monthly', due:15, authority:'EPFO'},
  {code:'ESI', name:'ESI Contribution', frequency:'Monthly', due:15, authority:'ESIC'},
  {code:'PT', name:'Professional Tax', frequency:'Monthly', due:30, authority:'TN Govt'},
  {code:'TDS', name:'TDS Return (24Q)', frequency:'Quarterly', due:31, authority:'Income Tax'},
  {code:'BONUS', name:'Bonus Payment', frequency:'Annually', due:30, authority:'Labour Dept'},
  {code:'LWF', name:'Labour Welfare Fund', frequency:'Half-Yearly', due:15, authority:'TN Govt'},
  {code:'CLRA', name:'CLRA Return', frequency:'Annually', due:31, authority:'Labour Dept'}
];
const MIN_WAGES_TN = {
  'Unskilled':8500, 'Semi-Skilled':9500, 'Skilled':11000, 'Highly Skilled':13000, 'Supervisor':15000, 'Clerical':12000
};
const DESIGNATION_SKILL_MAP = {
  'Helper':'Unskilled','Cleaner':'Unskilled','Peon':'Unskilled','Gardener':'Unskilled','Security':'Semi-Skilled','Security Night':'Semi-Skilled',
  'Site Worker':'Semi-Skilled','Painter':'Semi-Skilled','Plumber':'Semi-Skilled','Data Entry':'Semi-Skilled','Office Assistant':'Semi-Skilled',
  'Carpenter':'Skilled','Welder':'Skilled','Mason Head':'Skilled','Electrician':'Skilled','Fabricator':'Skilled','PEB Worker':'Skilled','PEB Fabricator':'Skilled',
  'Senior Fabricator':'Highly Skilled','Machine Operator':'Skilled','Quality Check':'Skilled',
  'Driver':'Semi-Skilled','Clerk':'Clerical','Receptionist':'Clerical','Store Keeper':'Clerical','Billing Executive':'Clerical',
  'Foreman':'Supervisor','Site Supervisor':'Supervisor','Factory Supervisor':'Supervisor','PEB Supervisor':'Supervisor',
  'Site Engineer':'Highly Skilled','Senior Architect':'Highly Skilled','Accountant':'Clerical','Office Staff':'Clerical','Senior Staff':'Clerical',
  'Accounts Manager':'Supervisor','Office Manager':'Supervisor','HR Manager':'Supervisor','Labour Head':'Supervisor',
  'Managing Director':'Supervisor','PEB Helper':'Unskilled'
};

// F7: Asset Management
const ASSET_TYPES = ['Laptop','Desktop','Mobile Phone','Tablet','Safety Helmet','Safety Shoes','Uniform','Vehicle','Tools','Furniture','Printer','Other'];
const ASSET_CONDITIONS = ['New','Good','Fair','Poor','Disposed'];
let assetInventory = [];
let assetNextId = 1;

// F8: Exit & F&F
let exitRequests = [];
let exitNextId = 1;
const NOTICE_PERIODS = {'MD':90,'HR':60,'Employee':30};
const CLEARANCE_DEPTS = ['IT & Systems','Finance','HR','Admin','Reporting Manager','Security'];

// F10: Announcements
const ANNOUNCE_CATEGORIES = ['General','Policy Update','Event','Achievement'];
let announcements = [];
let announcementNextId = 1;

// PROJECT MANAGEMENT
const PROJECT_STATUSES = ['Not Started', 'In Progress', 'On Track', 'Delayed', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
let projects = [];
let projectNextId = 1;
let projectTaskNextIds = {};

// SiteTrack constants
const BOQ_SHEET_TYPES = ['civil','peb','mezzanine_civil','mezzanine_peb'];
const BOQ_SHEET_LABELS = { civil:'Civil Works', peb:'PEB Works', mezzanine_civil:'Mezzanine Civil', mezzanine_peb:'Mezzanine PEB' };
const WEATHER_OPTIONS = ['Sunny','Cloudy','Rainy','Hot','Clear'];
let currentBOQSheetId = null;

function getProjectProgress(project) {
  // Use WBS progress if WBS tasks exist
  if (project.wbsTasks && project.wbsTasks.length > 0) {
    return getWBSProgress(project);
  }
  if (!project.tasks.length) return 0;
  const done = project.tasks.filter(t => t.status === 'Done').length;
  return Math.round((done / project.tasks.length) * 100);
}

function getWBSProgress(project) {
  if (!project.wbsTasks || project.wbsTasks.length === 0) return 0;
  var total = project.wbsTasks.reduce(function(sum, t) { return sum + (t.progressPct || 0); }, 0);
  return Math.round(total / project.wbsTasks.length);
}
let announcementReadStatus = {};

// Login credentials — SHA-256 hashes (not plaintext)
async function sha256(str) {
  // crypto.subtle requires HTTPS; fall back to JS implementation on HTTP
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  // Pure JS SHA-256 fallback for insecure contexts
  function rr(n,x){return(x>>>n)|(x<<(32-n))}
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes=new TextEncoder().encode(str);
  const bl=bytes.length*8;
  const pad=new Uint8Array(((bytes.length+9+63)&~63));
  pad.set(bytes); pad[bytes.length]=0x80;
  new DataView(pad.buffer).setUint32(pad.length-4,bl,false);
  let[h0,h1,h2,h3,h4,h5,h6,h7]=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for(let off=0;off<pad.length;off+=64){
    const w=new Array(64);const dv=new DataView(pad.buffer,off,64);
    for(let i=0;i<16;i++)w[i]=dv.getUint32(i*4,false);
    for(let i=16;i<64;i++){const s0=rr(7,w[i-15])^rr(18,w[i-15])^(w[i-15]>>>3);const s1=rr(17,w[i-2])^rr(19,w[i-2])^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let[a,b,c,d,e,f,g,h]=[h0,h1,h2,h3,h4,h5,h6,h7];
    for(let i=0;i<64;i++){const S1=rr(6,e)^rr(11,e)^rr(25,e);const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[i]+w[i])|0;const S0=rr(2,a)^rr(13,a)^rr(22,a);const mj=(a&b)^(a&c)^(b&c);const t2=(S0+mj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+h)|0;
  }
  return[h0,h1,h2,h3,h4,h5,h6,h7].map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
EMPLOYEES.forEach(e => { if (!e.status) e.status = 'Active'; });

// =====================================================
// LOGIN
// =====================================================
function togglePwdVisibility(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var isPassword = inp.type === 'password';
  inp.type = isPassword ? 'text' : 'password';
  var openEye = btn.querySelector('.eye-open');
  var closedEye = btn.querySelector('.eye-closed');
  if (openEye) openEye.style.display = isPassword ? 'none' : '';
  if (closedEye) closedEye.style.display = isPassword ? '' : 'none';
  btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
}

async function doLogin() {
  const id = document.getElementById('loginId').value.trim().toUpperCase();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  if (!id) { err.textContent = 'Please enter Employee Code'; return; }
  if (!pass) { err.textContent = 'Please enter Password'; return; }

  if (!isOnline) { err.textContent = 'No internet connection. Please check your network and try again.'; return; }

  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empCode: id, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Login failed'; return; }
    JWT_TOKEN = data.token;
    safeStorage.set('hrms_jwt', data.token);
    // Capture isSuperAdmin from login response immediately so loginAs can use it
    if (data.user && data.user.isSuperAdmin) _isSuperAdmin = true;
    var rememberMe = document.getElementById('rememberMe');
    var session = { empCode: id, token: data.token, expiry: Date.now() + 24*60*60*1000, rememberMe: rememberMe ? rememberMe.checked : false };
    safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
    await loginAs(id);
    requestNotificationPermission();
  } catch (e) {
    err.textContent = 'Cannot reach server. Please try again later.';
  }
}
// demoLogin removed — production mode, no demo access
async function loginAs(empCode) {
  showLoadingSpinner('Loading your data...');
  try {
    // Load all shared data from backend
    var loaded = await loadFromBackend();
    if (!loaded) {
      hideLoadingSpinner();
      showToast('Failed to load data from server. Please try again.');
      // Force logout
      JWT_TOKEN = null;
      safeStorage.remove('hrms_jwt');
      safeStorage.remove(STORAGE_KEYS.session);
      return;
    }

    // Load local-only data (Resume Bank, Projects, etc.)
    loadLocalOnlyData();

    // Find employee in DB-loaded EMPLOYEES array
    var empIdx = EMPLOYEES.findIndex(function(e) { return e.code === empCode; });
    if (empIdx < 0) {
      hideLoadingSpinner();
      showToast('Employee not found in database. Contact admin.');
      JWT_TOKEN = null;
      safeStorage.remove('hrms_jwt');
      safeStorage.remove(STORAGE_KEYS.session);
      return;
    }
    currentUser = {...EMPLOYEES[empIdx]};

    // Refresh JWT if role changed since last login
    try {
      var meRes = await fetch(API_BASE + '/auth/me', { method: 'GET', headers: apiHeaders() });
      if (meRes.ok) {
        var meData = await meRes.json();
        if (meData.token) {
          JWT_TOKEN = meData.token;
          safeStorage.set('hrms_jwt', meData.token);
          var session = safeStorage.get(STORAGE_KEYS.session);
          if (session) {
            var s = JSON.parse(session);
            s.token = meData.token;
            safeStorage.set(STORAGE_KEYS.session, JSON.stringify(s));
          }
        }
        if (meData.user && meData.user.role) {
          currentUser.role = meData.user.role;
        }
        if (meData.user && meData.user.isSuperAdmin) {
          currentUser.isSuperAdmin = true;
        }
      }
    } catch (e) { /* non-fatal — stale JWT still works for this session */ }

    // Show main UI
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appHeader').style.display = '';
    document.getElementById('appContent').style.display = '';
    document.getElementById('bottomTabs').style.display = '';
    _activeNavId = 'home';
    _navExpandedGroups = {};

    // Load feature access overrides (SuperAdmin-managed) before rendering nav
    await loadMyFeatureAccess();
    // Detect SuperAdmin from JWT or server response
    if (currentUser.isSuperAdmin) _isSuperAdmin = true;

    // Load public holidays so calendar badges work everywhere; refresh calendar once loaded
    loadPublicHolidays().then(function() { if (typeof buildCalendar === 'function') buildCalendar(); });

    applyRole();
    renderNavigation();
    updateGreeting();
    buildCalendar();
    initLeaveTabs();

    // Restore last page on reload
    var savedTab = sessionStorage.getItem('hrms_current_tab');
    var savedOverlay = sessionStorage.getItem('hrms_current_overlay');
    var savedNavId = sessionStorage.getItem('hrms_current_navId');
    if (savedNavId) _activeNavId = savedNavId;
    if (savedTab && savedTab !== 'home') {
      switchTab(savedTab, null, true);
    }
    if (savedOverlay) {
      showOverlay(savedOverlay);
    }
    history.replaceState({ tab: savedTab || 'home' }, '');

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Start WebSocket + notification polling + chatbot
    initWebSocket();
    startNotifPoll();
    showChatbot();
    // Ensure badge is updated immediately after data load
    updateNotifBadge();

  } finally {
    hideLoadingSpinner();
  }
}
function renderProfileOverlay() {
  var c = document.getElementById('profileContent');
  if (!c || !currentUser) return;
  var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; }) || currentUser;
  var initials = emp.name.split(' ').map(function(w){return w.charAt(0);}).join('').substring(0,2).toUpperCase();
  var isMDUser = currentUser.role === 'MD';
  var isHrMd = currentUser.role === 'MD' || currentUser.role === 'HR';

  // Fetch lock status asynchronously then render
  apiCall('GET', '/employees/' + currentUser.code + '/lock-status').then(function(lockData) {
    window._profileLockStatus = lockData;
    _renderProfileContent(c, emp, initials, isMDUser, isHrMd, lockData);
  }).catch(function() {
    window._profileLockStatus = { locks: { profile_details: true, educational_certs: true, bank_passbook: true, bank_details: true, experience_certs: true }, pending_requests: [], approved_requests: [], documents: [] };
    _renderProfileContent(c, emp, initials, isMDUser, isHrMd, window._profileLockStatus);
  });
}

function _isProfileSectionLocked(section, lockStatus) {
  if (!lockStatus || !lockStatus.locks || !lockStatus.locks[section]) return false;
  // If there's an approved request, section is unlocked
  var approved = (lockStatus.approved_requests || []).find(function(r) { return r.section === section; });
  return !approved;
}

function _renderLockBadge(section, lockStatus) {
  var locked = _isProfileSectionLocked(section, lockStatus);
  var pending = (lockStatus.pending_requests || []).find(function(r) { return r.section === section; });
  var approved = (lockStatus.approved_requests || []).find(function(r) { return r.section === section; });
  var html = '';
  if (lockStatus.locks && lockStatus.locks[section]) {
    if (approved) {
      html += '<span class="lock-badge unlocked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0"/></svg>Unlocked</span>';
    } else {
      html += '<span class="lock-badge locked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Locked</span>';
    }
  }
  if (pending && !approved) {
    html += '<div class="edit-request-status pending"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Edit request pending HR approval</div>';
  }
  return html;
}

function _renderDocUploadCard(doc) {
  var html = '<div class="doc-upload-card uploaded">';
  var ext = (doc.file_path || '').split('.').pop().toLowerCase();
  var isImg = ['jpg','jpeg','png','gif','webp'].indexOf(ext) >= 0;
  var docUrl = authUrl(doc.file_path);
  if (isImg) {
    html += '<a href="' + escapeHTML(docUrl) + '" target="_blank" style="display:block"><img class="doc-thumb" src="' + escapeHTML(docUrl) + '" alt="' + escapeHTML(doc.doc_name) + '"></a>';
  } else {
    html += '<a href="' + escapeHTML(docUrl) + '" target="_blank" style="display:block"><div style="height:70px;display:flex;align-items:center;justify-content:center;background:var(--gray-100);border-radius:6px;margin-bottom:6px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div></a>';
  }
  var fileName = (doc.file_path || '').split('/').pop() || doc.doc_name || doc.doc_type;
  html += '<div style="font-size:.65rem;color:#22c55e;font-weight:600;margin-bottom:2px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>Uploaded</div>';
  html += '<div class="doc-label" style="word-break:break-all;font-size:.6rem;color:var(--gray-500)" title="' + escapeHTML(fileName) + '">' + escapeHTML(fileName) + '</div>';
  html += '</div>';
  return html;
}

function requestSectionEdit(section) {
  var reason = prompt('Please provide a reason for editing this section:');
  if (!reason || !reason.trim()) return;
  apiCall('POST', '/employees/' + currentUser.code + '/request-edit', { section: section, reason: reason.trim() }).then(function() {
    showToast('Edit request submitted for HR approval');
    renderProfileOverlay();
  }).catch(function(err) {
    showToast(err.message || 'Failed to submit request', 'error');
  });
}

function _renderProfileContent(c, emp, initials, isMDUser, isHrMd, lockStatus) {

  // Check if entire profile is locked (one-time save rule)
  var profileLocked = _isProfileSectionLocked('profile_details', lockStatus);
  var profReadonly = profileLocked ? ' readonly' : '';
  var profDisabled = profileLocked ? ' disabled' : '';
  var profClass = profileLocked ? ' class="ss-readonly-locked"' : '';

  var html = '<div class="card profile-card" style="margin:16px;border-radius:var(--radius)">';
  var photoUrl = emp.photoUrl || emp.photo_url || null;
  html += '<div style="position:relative;display:inline-block">';
  if (photoUrl) {
    html += '<div class="profile-avatar" id="profAvatarImg" style="background-image:url(\'' + escapeHTML(authUrl(photoUrl)) + '\');background-size:cover;background-position:center"></div>';
  } else {
    html += '<div class="profile-avatar" id="profAvatarImg">' + escapeHTML(initials) + '</div>';
  }
  if (!profileLocked) {
    html += '<label for="profPhotoInput" style="position:absolute;bottom:0;right:0;width:28px;height:28px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></label>';
    html += '<input type="file" id="profPhotoInput" accept="image/*" style="display:none" onchange="uploadProfilePhoto()">';
  }
  html += '</div>';
  html += '<h2>' + escapeHTML(emp.name) + '</h2>';
  html += '<div class="designation">' + escapeHTML(emp.designation || emp.dept || '') + '</div>';
  html += '<div class="emp-id">' + escapeHTML(emp.code) + '</div>';
  if (profileLocked) {
    html += '<div style="margin-top:8px">' + _renderLockBadge('profile_details', lockStatus) + '</div>';
    html += '<button class="request-edit-btn" onclick="requestSectionEdit(\'profile_details\')" style="margin-top:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Request Edit Access</button>';
  }
  html += '</div>';

  // Section 1: Personal Information
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Personal Information</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  var dobVal = emp.dob ? (emp.dob.length > 10 ? emp.dob.substring(0,10) : emp.dob) : '';
  html += '<div class="ss-form-group"><label>Date of Birth</label><input type="date" id="profDob" value="' + escapeHTML(dobVal) + '"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Phone</label><input type="tel" id="profPhone" value="' + escapeHTML(emp.phone || '') + '" placeholder="Mobile number"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Email</label><input type="email" id="profEmail" value="' + escapeHTML(emp.email || '') + '" placeholder="Email address"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Blood Group</label><select class="nf-select" id="profBloodGroup"' + profDisabled + '>';
  var bgs = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  bgs.forEach(function(bg) { html += '<option value="' + bg + '"' + (emp.bloodGroup === bg ? ' selected' : '') + '>' + (bg || 'Select') + '</option>'; });
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Marital Status</label><select class="nf-select" id="profMaritalStatus"' + profDisabled + '>';
  var ms = ['', 'Single', 'Married', 'Divorced', 'Widowed'];
  ms.forEach(function(s) { html += '<option value="' + s + '"' + (emp.maritalStatus === s ? ' selected' : '') + '>' + (s || 'Select') + '</option>'; });
  html += '</select></div>';
  html += '</div></div>';

  // Section 2: Address (editable, always shown)
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Address</div>';
  html += '<div class="ss-form-group"><label>Present Address</label><textarea id="profPresentAddress" rows="2" placeholder="Current residential address"' + profReadonly + profClass + '>' + escapeHTML(emp.presentAddress || emp.address || '') + '</textarea></div>';
  var sameAddr = emp.presentAddress && emp.permanentAddress && emp.presentAddress === emp.permanentAddress;
  html += '<div class="ss-form-group"><label style="display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:.78rem"><input type="checkbox" id="profSameAddress" onchange="handleProfileSameAddress()"' + (sameAddr ? ' checked' : '') + profDisabled + '> Same as present address</label></div>';
  html += '<div class="ss-form-group"><label>Permanent Address</label><textarea id="profPermanentAddress" rows="2" placeholder="Permanent address"' + (sameAddr || profileLocked ? ' disabled' : '') + (profileLocked ? profClass : '') + '>' + escapeHTML(emp.permanentAddress || '') + '</textarea></div>';
  html += '</div>';

  // Section 3: Family & Emergency (editable)
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Family & Emergency</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Father\'s Name</label><input type="text" id="profFatherName" value="' + escapeHTML(emp.fatherName || '') + '" placeholder="Father name"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Father\'s Mobile</label><input type="tel" id="profFatherMobile" value="' + escapeHTML(emp.fatherMobile || '') + '" placeholder="Mobile"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Mother\'s Name</label><input type="text" id="profMotherName" value="' + escapeHTML(emp.motherName || '') + '" placeholder="Mother name"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Mother\'s Mobile</label><input type="tel" id="profMotherMobile" value="' + escapeHTML(emp.motherMobile || '') + '" placeholder="Mobile"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Spouse Name</label><input type="text" id="profSpouseName" value="' + escapeHTML(emp.spouseName || '') + '" placeholder="Spouse name (optional)"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Spouse Mobile</label><input type="tel" id="profSpouseMobile" value="' + escapeHTML(emp.spouseMobile || '') + '" placeholder="Mobile (optional)"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Emergency Contact</label><input type="text" id="profEmergency" value="' + escapeHTML(emp.emergencyContact || '') + '" placeholder="Contact person name"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Emergency Phone</label><input type="tel" id="profEmergencyPhone" value="' + escapeHTML(emp.emergencyPhone || '') + '" placeholder="Emergency number"' + profReadonly + profClass + '></div>';
  html += '</div></div>';

  // Section 4: Official Details
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Official Details</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Department</label><div class="ss-readonly">' + escapeHTML(emp.dept || '—') + '</div></div>';
  html += '<div class="ss-form-group"><label>Designation</label><div class="ss-readonly">' + escapeHTML(emp.designation || '—') + '</div></div>';
  var dojVal = emp.doj ? (emp.doj.length > 10 ? emp.doj.substring(0,10) : emp.doj) : '';
  var dojDisplay = dojVal ? new Date(dojVal + 'T00:00:00').toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—';
  html += '<div class="ss-form-group"><label>Date of Joining</label><div class="ss-readonly">' + escapeHTML(dojDisplay) + '</div></div>';
  html += '<div class="ss-form-group"><label>Employee Code</label><div class="ss-readonly">' + escapeHTML(emp.code) + '</div></div>';
  html += '<div class="ss-form-group"><label>Monthly Salary</label><div class="ss-readonly">' + (emp.salary ? '\u20B9' + Number(emp.salary).toLocaleString('en-IN') : '—') + '</div></div>';
  html += '<div class="ss-form-group"><label>Payment Mode</label><div class="ss-readonly">NEFT</div></div>';
  html += '</div></div>';

  // Section 5: Bank & Identity (read-only — managed by HR/MD)
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Bank & Identity <span style="font-size:.6rem;font-weight:500;color:var(--gray-400);margin-left:6px">Contact HR to update</span></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Bank</label><div class="ss-readonly">' + escapeHTML(emp.bank || '—') + '</div></div>';
  var accDisplay = emp.accNo ? (emp.accNo.length > 4 ? emp.accNo.replace(/.(?=.{4})/g, 'X') : emp.accNo) : '—';
  html += '<div class="ss-form-group"><label>Account No</label><div class="ss-readonly">' + escapeHTML(accDisplay) + '</div></div>';
  html += '<div class="ss-form-group"><label>IFSC Code</label><div class="ss-readonly">' + escapeHTML(emp.ifscCode || emp.ifsc_code || '—') + '</div></div>';
  html += '<div class="ss-form-group"><label>Bank Branch</label><div class="ss-readonly">' + escapeHTML(emp.bankBranch || emp.bank_branch || '—') + '</div></div>';
  html += '<div class="ss-form-group"><label>PAN</label><div class="ss-readonly">' + escapeHTML(emp.pan || '—') + '</div></div>';
  var aadhaarDisplay = emp.aadhaar ? (emp.aadhaar.length > 4 ? emp.aadhaar.replace(/.(?=.{4})/g, 'X') : emp.aadhaar) : '—';
  html += '<div class="ss-form-group"><label>Aadhaar</label><div class="ss-readonly">' + escapeHTML(aadhaarDisplay) + '</div></div>';
  html += '<div class="ss-form-group"><label>UAN</label><div class="ss-readonly">' + escapeHTML(emp.uan || '—') + '</div></div>';
  html += '</div>';
  // Document photo uploads
  html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200)">';
  html += '<div style="font-size:.72rem;font-weight:600;color:var(--gray-600);margin-bottom:8px">Document Uploads</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';

  // Aadhaar card
  html += '<div style="border:1.5px dashed ' + (emp.aadhaar_photo_url ? '#22c55e' : 'var(--gray-200)') + ';border-radius:10px;padding:12px;text-align:center;background:var(--gray-50,#f9fafb)">';
  if (emp.aadhaar_photo_url) {
    html += '<a href="' + escapeHTML(emp.aadhaar_photo_url) + '" target="_blank" style="display:block;margin-bottom:8px">' +
      '<img src="' + escapeHTML(emp.aadhaar_photo_url) + '" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb"></a>';
    html += '<div style="font-size:.65rem;color:#22c55e;font-weight:600;margin-bottom:4px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>Aadhaar Uploaded</div>';
    html += '<div style="font-size:.62rem;color:var(--gray-500);word-break:break-all">Aadhaar_Card.' + (emp.aadhaar_photo_url.split('.').pop() || 'jpg') + '</div>';
  } else {
    html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom:6px"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="8" cy="15" r="2"/><path d="M14 13h4m-4 3h4"/></svg>';
    html += '<div style="font-size:.72rem;font-weight:600;color:var(--gray-500);margin-bottom:6px">Aadhaar Card</div>';
    if (!profileLocked) {
      html += '<button onclick="scanAndUploadDoc(\'aadhaar_photo\')" style="font-size:.68rem;padding:6px 14px;border:1px solid var(--primary);color:var(--primary);background:transparent;border-radius:8px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'var(--primary)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--primary)\'">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
      html += 'Scan & Upload</button>';
    }
  }
  html += '</div>';

  // PAN card
  html += '<div style="border:1.5px dashed ' + (emp.pan_photo_url ? '#22c55e' : 'var(--gray-200)') + ';border-radius:10px;padding:12px;text-align:center;background:var(--gray-50,#f9fafb)">';
  if (emp.pan_photo_url) {
    html += '<a href="' + escapeHTML(emp.pan_photo_url) + '" target="_blank" style="display:block;margin-bottom:8px">' +
      '<img src="' + escapeHTML(emp.pan_photo_url) + '" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb"></a>';
    html += '<div style="font-size:.65rem;color:#22c55e;font-weight:600;margin-bottom:4px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>PAN Uploaded</div>';
    html += '<div style="font-size:.62rem;color:var(--gray-500);word-break:break-all">PAN_Card.' + (emp.pan_photo_url.split('.').pop() || 'jpg') + '</div>';
  } else {
    html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom:6px"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 9h10M7 13h6"/></svg>';
    html += '<div style="font-size:.72rem;font-weight:600;color:var(--gray-500);margin-bottom:6px">PAN Card</div>';
    if (!profileLocked) {
      html += '<button onclick="scanAndUploadDoc(\'pan_photo\')" style="font-size:.68rem;padding:6px 14px;border:1px solid var(--primary);color:var(--primary);background:transparent;border-radius:8px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'var(--primary)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--primary)\'">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
      html += 'Scan & Upload</button>';
    }
  }
  html += '</div>';

  html += '</div></div></div>';

  // Section 6: Qualification & Experience (editable, always shown)
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>Qualification & Experience</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Qualification</label><input type="text" id="profQualification" value="' + escapeHTML(emp.qualification || '') + '" placeholder="e.g. B.E Civil"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Institution</label><input type="text" id="profInstitution" value="' + escapeHTML(emp.institution || '') + '" placeholder="College / University"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Year of Passing</label><input type="text" id="profYearOfPassing" value="' + escapeHTML(emp.yearOfPassing || '') + '" placeholder="e.g. 2020"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Years of Experience</label><input type="number" id="profYearsExp" value="' + escapeHTML(String(emp.yearsOfExperience || '')) + '" placeholder="e.g. 5" step="0.5" min="0"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Previous Employer</label><input type="text" id="profPrevEmployer" value="' + escapeHTML(emp.previousEmployer || '') + '" placeholder="Last company name"' + profReadonly + profClass + '></div>';
  html += '<div class="ss-form-group"><label>Previous Role</label><input type="text" id="profPrevRole" value="' + escapeHTML(emp.previousRole || '') + '" placeholder="Last designation"' + profReadonly + profClass + '></div>';
  html += '</div></div>';

  // Section 7: Educational Certificates (lockable document upload)
  var eduLocked = _isProfileSectionLocked('educational_certs', lockStatus);
  var eduDocs = (lockStatus.documents || []).filter(function(d) { return d.doc_type === 'educational_cert'; });
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>Educational Certificates' + _renderLockBadge('educational_certs', lockStatus) + '</div>';
  html += '<div class="doc-upload-grid">';
  eduDocs.forEach(function(d) { html += _renderDocUploadCard(d); });
  if (!eduLocked && eduDocs.length === 0) {
    html += '<div class="doc-upload-card dashed" onclick="scanAndUploadDoc(\'educational_cert\')">';
    html += '<div style="height:70px;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
    html += '<div class="doc-label">Upload Certificate</div></div>';
  }
  html += '</div>';
  if (eduLocked) {
    html += '<button class="request-edit-btn" onclick="requestSectionEdit(\'educational_certs\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Request Edit Access</button>';
  }
  html += '</div>';

  // Section 8: Bank Passbook (lockable document upload)
  var pbLocked = _isProfileSectionLocked('bank_passbook', lockStatus);
  var pbDocs = (lockStatus.documents || []).filter(function(d) { return d.doc_type === 'bank_passbook'; });
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Bank Passbook' + _renderLockBadge('bank_passbook', lockStatus) + '</div>';
  html += '<div class="doc-upload-grid">';
  pbDocs.forEach(function(d) { html += _renderDocUploadCard(d); });
  if (!pbLocked && pbDocs.length === 0) {
    html += '<div class="doc-upload-card dashed" onclick="scanAndUploadDoc(\'bank_passbook\')">';
    html += '<div style="height:70px;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
    html += '<div class="doc-label">Upload Passbook</div></div>';
  }
  html += '</div>';
  if (pbLocked) {
    html += '<button class="request-edit-btn" onclick="requestSectionEdit(\'bank_passbook\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Request Edit Access</button>';
  }
  html += '</div>';

  // Section 9: Experience Certificates (lockable document upload)
  var expLocked = _isProfileSectionLocked('experience_certs', lockStatus);
  var expDocs = (lockStatus.documents || []).filter(function(d) { return d.doc_type === 'experience_cert'; });
  html += '<div class="card profile-section" style="margin:0 16px 12px;border-radius:var(--radius)">';
  html += '<div class="profile-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Experience Certificates' + _renderLockBadge('experience_certs', lockStatus) + '</div>';
  html += '<div class="doc-upload-grid">';
  expDocs.forEach(function(d) { html += _renderDocUploadCard(d); });
  if (!expLocked && expDocs.length === 0) {
    html += '<div class="doc-upload-card dashed" onclick="scanAndUploadDoc(\'experience_cert\')">';
    html += '<div style="height:70px;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
    html += '<div class="doc-label">Upload Certificate</div></div>';
  }
  html += '</div>';
  if (expLocked) {
    html += '<button class="request-edit-btn" onclick="requestSectionEdit(\'experience_certs\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Request Edit Access</button>';
  }
  html += '</div>';

  // Save button (centered) — hidden when profile is locked
  if (!profileLocked) {
    html += '<div style="padding:12px 16px;text-align:center"><button class="nf-btn nf-btn-primary ss-save-btn" id="profSaveBtn" style="border-radius:var(--radius);min-width:200px;padding:12px 32px;font-size:.85rem" onclick="saveProfileDetails()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes</button><div id="profSaveMsg" style="margin-top:8px;font-size:.78rem;font-weight:600;display:none"></div></div>';
  }

  // Actions
  html += '<div style="padding:0 16px 8px"><button class="payroll-report-btn" onclick="downloadIDCard()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Download ID Card (PDF)</button></div>';
  html += '<div style="padding:0 16px 24px"><button class="btn btn-outline w-full" style="border-radius:var(--radius);color:var(--danger);border-color:var(--danger-light)" onclick="doLogout()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Log Out</button></div>';
  c.innerHTML = html;
}

function saveProfileDetails() {
  if (!currentUser) return;
  var g = function(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };

  // Validate required fields
  var required = [
    {id:'profDob', label:'Date of Birth'},
    {id:'profPhone', label:'Phone'},
    {id:'profEmail', label:'Email'},
    {id:'profBloodGroup', label:'Blood Group'},
    {id:'profMaritalStatus', label:'Marital Status'},
    {id:'profPresentAddress', label:'Present Address'},
    {id:'profPermanentAddress', label:'Permanent Address'},
    {id:'profFatherName', label:"Father's Name"},
    {id:'profFatherMobile', label:"Father's Mobile"},
    {id:'profMotherName', label:"Mother's Name"},
    {id:'profMotherMobile', label:"Mother's Mobile"},
    {id:'profEmergency', label:'Emergency Contact'},
    {id:'profEmergencyPhone', label:'Emergency Phone'},
    {id:'profQualification', label:'Qualification'},
    {id:'profInstitution', label:'Institution'},
    {id:'profYearOfPassing', label:'Year of Passing'}
  ];

  var missing = [];
  required.forEach(function(f) {
    var val = g(f.id);
    if (!val) {
      missing.push(f.label);
      var el = document.getElementById(f.id);
      if (el) { el.style.border = '2px solid var(--danger)'; el.addEventListener('input', function() { this.style.border = ''; }, {once:true}); el.addEventListener('change', function() { this.style.border = ''; }, {once:true}); }
    }
  });

  if (missing.length > 0) {
    showToast('Please fill: ' + missing.slice(0, 3).join(', ') + (missing.length > 3 ? ' and ' + (missing.length - 3) + ' more' : ''), 'error');
    // Scroll to first empty field
    var firstEmpty = document.getElementById(required.find(function(f) { return !g(f.id); }).id);
    if (firstEmpty) firstEmpty.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }

  var payload = {
    dob: g('profDob'),
    phone: g('profPhone'),
    email: g('profEmail'),
    bloodGroup: g('profBloodGroup'),
    maritalStatus: g('profMaritalStatus'),
    presentAddress: g('profPresentAddress'),
    permanentAddress: g('profPermanentAddress'),
    fatherName: g('profFatherName'),
    fatherMobile: g('profFatherMobile'),
    motherName: g('profMotherName'),
    motherMobile: g('profMotherMobile'),
    spouseName: g('profSpouseName'),
    spouseMobile: g('profSpouseMobile'),
    emergencyContact: g('profEmergency'),
    emergencyPhone: g('profEmergencyPhone'),
    qualification: g('profQualification'),
    institution: g('profInstitution'),
    yearOfPassing: g('profYearOfPassing'),
    previousEmployer: g('profPrevEmployer'),
    previousRole: g('profPrevRole'),
    yearsOfExperience: g('profYearsExp')
  };
  var btn = document.getElementById('profSaveBtn');
  apiCall('PUT', '/employees/' + currentUser.code + '/self', payload).then(function() {
    // Refresh employee data from DB
    return apiCall('GET', '/employees');
  }).then(function(resp) {
    var freshData = resp && resp.data ? resp.data : (Array.isArray(resp) ? resp : []);
    freshData.forEach(function(dbEmp) {
      // Map snake_case DB fields to camelCase used in frontend
      dbEmp.accNo = dbEmp.acc_no || dbEmp.accNo;
      dbEmp.photoUrl = dbEmp.photo_url || dbEmp.photoUrl;
      dbEmp.presentAddress = dbEmp.present_address || dbEmp.presentAddress;
      dbEmp.permanentAddress = dbEmp.permanent_address || dbEmp.permanentAddress;
      dbEmp.fatherName = dbEmp.father_name || dbEmp.fatherName;
      dbEmp.fatherMobile = dbEmp.father_mobile || dbEmp.fatherMobile;
      dbEmp.motherName = dbEmp.mother_name || dbEmp.motherName;
      dbEmp.motherMobile = dbEmp.mother_mobile || dbEmp.motherMobile;
      dbEmp.spouseName = dbEmp.spouse_name || dbEmp.spouseName;
      dbEmp.spouseMobile = dbEmp.spouse_mobile || dbEmp.spouseMobile;
      dbEmp.bloodGroup = dbEmp.blood_group || dbEmp.bloodGroup;
      dbEmp.maritalStatus = dbEmp.marital_status || dbEmp.maritalStatus;
      dbEmp.emergencyContact = dbEmp.emergency_contact || dbEmp.emergencyContact;
      dbEmp.emergencyPhone = dbEmp.emergency_phone || dbEmp.emergencyPhone;
      dbEmp.yearOfPassing = dbEmp.year_of_passing || dbEmp.yearOfPassing;
      dbEmp.previousEmployer = dbEmp.previous_employer || dbEmp.previousEmployer;
      dbEmp.previousRole = dbEmp.previous_role || dbEmp.previousRole;
      dbEmp.yearsOfExperience = dbEmp.years_of_experience || dbEmp.yearsOfExperience;
      dbEmp.ifscCode = dbEmp.ifsc_code || dbEmp.ifscCode;
      dbEmp.bankBranch = dbEmp.bank_branch || dbEmp.bankBranch;
      // Update EMPLOYEES array
      var idx = EMPLOYEES.findIndex(function(e) { return e.code === dbEmp.code; });
      if (idx >= 0) Object.assign(EMPLOYEES[idx], dbEmp);
    });
    var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; });
    if (emp) currentUser = Object.assign({}, currentUser, emp);
    renderProfileOverlay();
    // Show success message after re-render
    setTimeout(function() {
      var msg = document.getElementById('profSaveMsg');
      var b = document.getElementById('profSaveBtn');
      if (msg) { msg.style.display = 'block'; msg.style.color = 'var(--success)'; msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Saved successfully'; }
      if (b) { b.style.background = 'var(--success)'; b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><polyline points="20 6 9 17 4 12"/></svg>Saved'; setTimeout(function() { if (document.getElementById('profSaveBtn')) { b.style.background = ''; b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes'; } }, 3000); }
      if (msg) setTimeout(function() { if (msg) msg.style.display = 'none'; }, 4000);
    }, 100);
  }).catch(function(err) {
    var msg = document.getElementById('profSaveMsg');
    if (msg) { msg.style.display = 'block'; msg.style.color = 'var(--danger)'; msg.textContent = 'Failed to save: ' + (err.message || 'Server error'); }
    if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes'; btn.style.background = ''; btn.disabled = false; }
  });
  if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Saving...'; btn.disabled = true; setTimeout(function() { if (btn) btn.disabled = false; }, 5000); }
}
function uploadProfilePhoto() {
  var fileInput = document.getElementById('profPhotoInput');
  if (!fileInput || !fileInput.files[0] || !currentUser) return;
  var formData = new FormData();
  formData.append('photo', fileInput.files[0]);
  var token = JWT_TOKEN || safeStorage.get('hrms_jwt');
  fetch('/api/employees/' + currentUser.code + '/photo', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.photo_url) {
      currentUser.photo_url = data.photo_url;
      currentUser.photoUrl = data.photo_url;
      var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; });
      if (emp) { emp.photo_url = data.photo_url; emp.photoUrl = data.photo_url; }
      var authedPhotoUrl = authUrl(data.photo_url);
      var avatar = document.getElementById('profAvatarImg');
      if (avatar) {
        avatar.style.backgroundImage = 'url(\'' + authedPhotoUrl + '\')';
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      }
      // Update header avatar too
      var headerAv = document.getElementById('headerAvatar');
      if (headerAv) {
        headerAv.textContent = '';
        headerAv.style.backgroundImage = 'url(\'' + authedPhotoUrl + '\')';
        headerAv.style.backgroundSize = 'cover';
        headerAv.style.backgroundPosition = 'center';
      }
      showToast('Photo uploaded');
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  }).catch(function(e) { showToast('Upload failed: ' + e.message, 'error'); });
}

function handleProfileSameAddress() {
  var cb = document.getElementById('profSameAddress');
  var permEl = document.getElementById('profPermanentAddress');
  if (cb && permEl) {
    if (cb.checked) {
      var presEl = document.getElementById('profPresentAddress');
      permEl.value = presEl ? presEl.value : '';
      permEl.disabled = true;
    } else {
      permEl.disabled = false;
    }
  }
}

function requestProfileChange() {
  if (!currentUser) return;
  addNotification('Profile Change Request', currentUser.name + ' (' + currentUser.code + ') has requested to update personal details', 'general');
  showToast('Change request sent to MD for approval');
}

function doLogout() {
  currentUser = null;
  JWT_TOKEN = null;
  safeStorage.remove('hrms_jwt');
  // Clean up idle timer, warning timer, and notification poll
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  if (idleWarningTimer) { clearTimeout(idleWarningTimer); idleWarningTimer = null; }
  stopNotifPoll();
  disconnectWebSocket();
  hideChatbot();
  sessionStorage.removeItem('hrms_current_tab');
  sessionStorage.removeItem('hrms_current_overlay');
  sessionStorage.removeItem('hrms_current_navId');
  // Prevent Google auto-login after logout
  try { if (typeof google !== 'undefined' && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appHeader').style.display = 'none';
  document.getElementById('appContent').style.display = 'none';
  document.getElementById('bottomTabs').style.display = 'none';
  document.getElementById('loginId').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  // Close overlays without touching history (we'll reset history below)
  document.querySelectorAll('.overlay-screen.active').forEach(function(o) { o.classList.remove('active'); o.removeAttribute('style'); });
  _overlayPreviousFocus = [];
  // Reset to home tab without pushing history
  switchTab('home', document.querySelector('[data-tab=home]'), true);
  // Clear all navigation history
  history.replaceState(null, '');
}

// =====================================================
// FORGOT PASSWORD
// =====================================================
function showForgotPassword() {
  const form = document.querySelector('.login-form');
  form.innerHTML = `
    <div style="margin-bottom:12px;font-family:var(--font-display);font-size:.95rem;font-weight:600">Forgot Password?</div>
    <div style="font-size:.78rem;color:rgba(255,255,255,.85);line-height:1.5;padding:12px;background:rgba(255,255,255,.1);border-radius:8px;margin-bottom:12px">
      Please contact your <strong>HR</strong> to reset your password.<br><br>
      HR will reset it from their panel and provide you a temporary password.
    </div>
    <div style="margin-top:12px;text-align:center"><a href="#" onclick="restoreLoginForm();return false" style="font-size:.72rem;color:rgba(255,255,255,.7);text-decoration:none">&larr; Back to Login</a></div>
  `;
}

function restoreLoginForm() {
  const form = document.querySelector('.login-form');
  form.innerHTML = '<div class="login-form-header"><div class="login-form-logo"><img src="swetha_new_logo.png" alt="SS" style="width:180px;height:auto;object-fit:contain"></div><h2 class="login-welcome">Welcome Back!</h2><p class="login-welcome-sub">Sign in to your HRMS account</p></div>' +
    '<div class="login-field"><label>Employee Code / Phone</label><div class="login-input-wrap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" id="loginId" placeholder="e.g. MD001, SS001" maxlength="50" autocomplete="username"></div></div>' +
    '<div class="login-field"><label>Password</label><div class="login-input-wrap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input type="password" id="loginPass" placeholder="Enter password" maxlength="128" autocomplete="current-password"><button type="button" class="pwd-toggle" onclick="togglePwdVisibility(\'loginPass\',this)" aria-label="Show password"><svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button></div></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><label style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--gray-500);cursor:pointer"><input type="checkbox" id="rememberMe" style="accent-color:var(--primary);width:15px;height:15px">Remember me</label><a href="#" id="forgotPwdLink" onclick="showForgotPassword();return false" style="font-size:.75rem;color:var(--primary);text-decoration:none;font-weight:500">Forgot Password?</a></div>' +
    '<button class="login-btn" id="signInBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Sign In</button>' +
    '<div class="login-divider"><span>OR</span></div>' +
    '<button class="login-btn login-btn-outline" id="biometricBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4"/><path d="M8 11a4 4 0 0 1 8 0c0 2.5-2 5-4 6.5"/><path d="M6 11a6 6 0 0 1 12 0c0 4-3 7-6 9"/></svg>Biometric Login</button>' +
    '<div class="login-error" id="loginError"></div>';
  // Re-attach event listeners
  document.getElementById('signInBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keyup', function(e) { if (e.key === 'Enter') doLogin(); });
}

// =====================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================
function applyRole() {
  const role = currentUser.role;
  const isMD = role === 'MD';
  const isHR = role === 'HR';
  const isManager = role === 'Manager';
  const isMDorHR = isMD || isHR || isManager;
  const isTempMD = isTemporaryMD();

  // Role badge
  const badge = document.getElementById('roleBadge');
  badge.textContent = isTempMD ? 'Temp MD' : role;
  badge.className = 'role-badge ' + role.toLowerCase();

  // Header avatar — show profile photo if available, else initials
  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  var headerAv = document.getElementById('headerAvatar');
  var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; });
  var avatarPhoto = currentUser.photo_url || (emp && (emp.photo_url || emp.photoUrl)) || null;
  if (avatarPhoto) {
    headerAv.textContent = '';
    headerAv.style.backgroundImage = 'url(\'' + authUrl(avatarPhoto) + '\')';
    headerAv.style.backgroundSize = 'cover';
    headerAv.style.backgroundPosition = 'center';
  } else {
    headerAv.textContent = initials;
    headerAv.style.backgroundImage = '';
  }

  // Admin button (MD and HR)
  document.getElementById('adminBtn').style.display = (isMD || currentUser.role === 'HR') ? '' : 'none';
  // Settings button (all roles including MD)
  document.getElementById('settingsBtn').style.display = '';

  // Hide "Apply Leave" quick link for MD
  var qlLeave = document.getElementById('qlApplyLeave');
  if (qlLeave) qlLeave.style.display = isMD ? 'none' : '';

  // Show/hide MD/HR-only elements (skip nav — it's rendered dynamically)
  document.querySelectorAll('.md-hr-only').forEach(el => {
    if (el.closest('#bottomTabs')) return;
    el.classList.toggle('hidden', !isMDorHR);
  });

  // Show/hide MD-only elements (skip nav)
  document.querySelectorAll('.md-only').forEach(el => {
    if (el.closest('#bottomTabs')) return;
    el.classList.toggle('hidden', !isMD);
  });
  document.getElementById('locationBtn').style.display = isMD ? '' : 'none';

  // Greeting
  document.getElementById('greetingName').innerHTML = escapeHTML(currentUser.name) + ' <span class="wave">&#128075;</span>';

  // Profile overlay
  updateProfileOverlay();

  // Salary screen — role-based content
  updateSalaryScreen();

  // Home: My Tasks & My Projects
  renderHomeTasks();
  renderHomeProjects();

  // Recent Activity (role-filtered)
  renderRecentActivity();

  // Home quick stats
  renderHomeQuickStats();

  // Analytics charts
  renderHomeAnalytics();

  // Advance requests
  renderAdvancePendingBanner();
  renderMyAdvanceRequests();

  // Leave screen
  renderLeaveScreen();

  // Notifications
  renderNotifications();
  updateNotifBadge();
  restoreNotifPrefToggles();

  // Update the profile avatar in overlay
  const pa = document.querySelector('.profile-avatar');
  if (pa) pa.textContent = initials;
  const pn = document.querySelector('.profile-card h2');
  if (pn) pn.textContent = currentUser.name;
  const pd = document.querySelector('.profile-card .designation');
  if (pd) pd.textContent = currentUser.dept + ' — ' + currentUser.designation;
  const pi = document.querySelector('.profile-card .emp-id');
  if (pi) pi.textContent = currentUser.code;
}

function updateProfileOverlay() {
  const section = document.querySelector('#overlay-profile .profile-section:first-of-type');
  if (!section) return;
  // Update salary details section
  const salRow = section.querySelectorAll('.profile-row');
  if (salRow.length >= 6) {
    salRow[0].querySelector('.value').innerHTML = '&#8377;' + currentUser.salary.toLocaleString('en-IN');
    salRow[1].querySelector('.value').innerHTML = '&#8377;' + (currentUser.salary / 31).toFixed(2);
    salRow[5].querySelector('.value').innerHTML = '&#8377;' + currentUser.salary.toLocaleString('en-IN');
  }
  // Update company details
  const compSection = document.querySelectorAll('#overlay-profile .profile-section')[1];
  if (compSection) {
    const rows = compSection.querySelectorAll('.profile-row');
    if (rows.length >= 4) {
      rows[1].querySelector('.value').textContent = currentUser.dept;
      rows[2].querySelector('.value').textContent = currentUser.bank + ' — ' + currentUser.accNo;
      rows[3].querySelector('.value').textContent = currentUser.code;
    }
  }
}

// Seeded random for deterministic data
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s) + seed.charCodeAt(i) | 0;
  s = Math.abs(s) || 1;
  return function() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateMonthlySalary(emp, monthIdx, year) {
  const gross = emp.salary || 0;
  const basic = Math.round(gross * 0.50);
  const hra = Math.round(gross * 0.20);
  const da = Math.round(gross * 0.10);
  const otherAllow = Math.round(gross * 0.10);
  const specialAllow = gross - basic - hra - da - otherAllow;
  const pf = Math.round(gross * 0.06);
  const esi = Math.round(gross * 0.02);
  const profTax = Math.round(gross * 0.02);
  const totalDed = pf + esi + profTax;
  const net = gross - totalDed;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const workedDays = daysInMonth;
  return { gross, basic, hra, da, otherAllow, specialAllow, pf, esi, profTax, totalDed, net, workedDays, daysInMonth };
}

// =====================================================
// PAYROLL BANK FILE + PF/ESI CHALLAN HELPERS
// =====================================================
const BANK_IFSC = { 'UOB': 'UBIN0530786', 'SBI': 'SBIN0001234', 'Cash': '' };

function getStatutoryIds(empCode) {
  var num = parseInt(empCode.replace(/\D/g, ''), 10) || 1;
  return {
    uan: '1013' + String(20000000 + num).padStart(8, '0'),
    esiIp: '3100' + String(1000000 + num).padStart(7, '0')
  };
}

function downloadCSV(content, filename) {
  var blob = new Blob([content], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadBankNEFTFile() {
  var fm = FY_MONTHS[activeSalaryMonth];
  var rows = [['Sr','Beneficiary Name','Account No','IFSC Code','Amount','Narration']];
  EMPLOYEES.forEach(function(emp, i) {
    if (emp.bank === 'Cash') return;
    var s = generateMonthlySalary(emp, fm.mi, fm.y);
    var ifsc = BANK_IFSC[emp.bank] || 'UBIN0530786';
    rows.push([i + 1, emp.name, emp.accNo, ifsc, s.net, 'SAL ' + fm.m + ' ' + fm.y]);
  });
  var csv = rows.map(function(r) { return r.join(','); }).join('\n');
  downloadCSV(csv, 'NEFT_Bank_File_' + fm.m + '_' + fm.y + '.csv');
  showToast('Bank NEFT file downloaded');
  addNotification('Bank File Generated', fm.m + ' ' + fm.y + ' NEFT file ready', 'payroll');
}

function downloadPFECRFile() {
  var fm = FY_MONTHS[activeSalaryMonth];
  var rows = [];
  EMPLOYEES.forEach(function(emp) {
    var s = generateMonthlySalary(emp, fm.mi, fm.y);
    var ids = getStatutoryIds(emp.code);
    var epfWage = Math.min(s.basic + s.da, 15000);
    var epf = Math.round(epfWage * 0.12);
    var eps = Math.round(epfWage * 0.0833);
    var diff = epf - eps;
    rows.push([ids.uan, emp.name, s.gross, epfWage, epfWage, epfWage, epf, eps, diff, 0].join('#~#'));
  });
  downloadCSV(rows.join('\n'), 'PF_ECR_' + fm.m + '_' + fm.y + '.txt');
  showToast('PF ECR file downloaded');
  addNotification('PF ECR Generated', fm.m + ' ' + fm.y + ' PF ECR file ready', 'payroll');
}

function downloadESIReturnFile() {
  var fm = FY_MONTHS[activeSalaryMonth];
  var rows = [['ESI IP Number','Name','No of Days','Total Wages','Employee Contribution','Employer Contribution']];
  EMPLOYEES.forEach(function(emp) {
    var s = generateMonthlySalary(emp, fm.mi, fm.y);
    if (s.gross > 21000) return;
    var ids = getStatutoryIds(emp.code);
    var empContrib = Math.round(s.gross * 0.0075);
    var erContrib = Math.round(s.gross * 0.0325);
    rows.push([ids.esiIp, emp.name, s.workedDays, s.gross, empContrib, erContrib]);
  });
  var csv = rows.map(function(r) { return r.join(','); }).join('\n');
  downloadCSV(csv, 'ESI_Return_' + fm.m + '_' + fm.y + '.csv');
  showToast('ESI return file downloaded');
  addNotification('ESI Return Generated', fm.m + ' ' + fm.y + ' ESI return ready', 'payroll');
}

let activeSalaryMonth = 8; // Dec (0=Apr in FY, so index 8 = Dec)
const FY_MONTHS = (function() {
  var now = new Date(), curY = now.getFullYear(), curM = now.getMonth();
  var fyStart = curM >= 3 ? curY : curY - 1; // FY starts in April
  var names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var months = [];
  for (var i = 0; i < 12; i++) {
    var mi = (3 + i) % 12; // Apr=3, May=4, ... Mar=2
    var y = mi >= 3 ? fyStart : fyStart + 1;
    months.push({ m: names[mi], mi: mi, y: y });
  }
  return months;
})();

function selectSalaryMonth(idx) {
  activeSalaryMonth = idx;
  updateSalaryScreen();
}

function togglePayslipDetail(el) {
  // Don't toggle if clicking the download button
  if (event && event.target.closest('.download-btn')) return;
  // Collapse all other expanded cards
  document.querySelectorAll('.salary-item.expanded').forEach(function(item) {
    if (item !== el) item.classList.remove('expanded');
  });
  el.classList.toggle('expanded');
}

function updateSalaryScreen() {
  if (!currentUser) return;
  const container = document.getElementById('salaryContent');
  if (!container) return;
  const role = currentUser.role;
  const isMDorHR = role === 'MD' || role === 'HR';
  const fm = FY_MONTHS[activeSalaryMonth];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mName = monthNames[fm.mi];
  const dlBtnSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  // Month pills
  let pills = '<div class="month-filter">';
  FY_MONTHS.forEach((f,i) => {
    pills += `<div class="month-pill${i===activeSalaryMonth?' active':''}" onclick="selectSalaryMonth(${i})">${f.m} ${String(f.y).slice(2)}</div>`;
  });
  pills += '</div>';

  if (isMDorHR) {
    // Group by dept
    const depts = {};
    let totalGross = 0;
    EMPLOYEES.forEach(emp => {
      const s = generateMonthlySalary(emp, fm.mi, fm.y);
      totalGross += s.gross;
      if (!depts[emp.dept]) depts[emp.dept] = [];
      depts[emp.dept].push({ emp, s });
    });

    // YTD bar heights
    const barH = FY_MONTHS.map((f,i) => {
      if (i > activeSalaryMonth) return 0;
      let t = 0; EMPLOYEES.forEach(e => t += generateMonthlySalary(e, f.mi, f.y).gross);
      return t;
    });
    const maxBar = Math.max(...barH, 1);

    let html = `<div class="ytd-card fade-in">
      <div class="ytd-label">Overall Salary — FY 2025–26</div>
      <div class="ytd-amount">&#8377;${totalGross.toLocaleString('en-IN')}</div>
      <div class="ytd-chart">${barH.map((h,i) => `<div class="ytd-bar${i===activeSalaryMonth?' current':''}" style="height:${Math.round(h/maxBar*100)}%"></div>`).join('')}</div>
      <div class="ytd-months"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span></div>
    </div>`;
    html += pills;

    for (const dept of Object.keys(depts).sort()) {
      html += `<div class="section-title">${fm.m} ${fm.y} — ${dept}</div>`;
      depts[dept].forEach(({ emp, s }) => {
        html += `<div class="salary-item fade-in" onclick="togglePayslipDetail(this)">
          <div class="salary-month"><span class="m">${fm.m}</span><span class="y">${fm.y}</span></div>
          <div class="salary-info"><h4>${emp.name}</h4><p>${emp.code} &middot; ${emp.dept} &middot; ${s.workedDays} days</p></div>
          <div class="salary-net"><div class="value">&#8377;${s.net.toLocaleString('en-IN')}</div><div class="label">Net Pay</div></div>
          <button class="download-btn">${dlBtnSvg}</button>
          <div class="payslip-detail">
            <div class="ps-section">
              <div class="ps-title">Earnings</div>
              <div class="ps-row"><span class="ps-label">Basic</span><span class="ps-val">&#8377;${s.basic.toLocaleString('en-IN')}</span></div>
              <div class="ps-row"><span class="ps-label">HRA</span><span class="ps-val">&#8377;${s.hra.toLocaleString('en-IN')}</span></div>
              <div class="ps-row"><span class="ps-label">DA</span><span class="ps-val">&#8377;${s.da.toLocaleString('en-IN')}</span></div>
              <div class="ps-row"><span class="ps-label">Other Allow.</span><span class="ps-val">&#8377;${s.otherAllow.toLocaleString('en-IN')}</span></div>
              <div class="ps-row"><span class="ps-label">Special Allow.</span><span class="ps-val">&#8377;${s.specialAllow.toLocaleString('en-IN')}</span></div>
              <div class="ps-row ps-total"><span class="ps-label">Gross</span><span class="ps-val">&#8377;${s.gross.toLocaleString('en-IN')}</span></div>
            </div>
            <div class="ps-section">
              <div class="ps-title">Deductions</div>
              <div class="ps-row ps-deduction"><span class="ps-label">PF (6%)</span><span class="ps-val">- &#8377;${s.pf.toLocaleString('en-IN')}</span></div>
              <div class="ps-row ps-deduction"><span class="ps-label">ESI (2%)</span><span class="ps-val">- &#8377;${s.esi.toLocaleString('en-IN')}</span></div>
              <div class="ps-row ps-deduction"><span class="ps-label">Prof. Tax (2%)</span><span class="ps-val">- &#8377;${s.profTax.toLocaleString('en-IN')}</span></div>
              <div class="ps-row ps-total"><span class="ps-label">Total Ded.</span><span class="ps-val" style="color:var(--danger)">- &#8377;${s.totalDed.toLocaleString('en-IN')}</span></div>
            </div>
            <div class="ps-row ps-total" style="font-size:.85rem"><span class="ps-label">Net Pay</span><span class="ps-val">&#8377;${s.net.toLocaleString('en-IN')}</span></div>
            <div class="ps-actions"><button class="ps-dl-btn download-btn" style="width:auto;height:auto;border-radius:var(--radius-xs)">${dlBtnSvg} Download PDF</button></div>
          </div>
        </div>`;
      });
    }
    container.innerHTML = html;
  } else {
    // Employee: own salary across all months
    let html = `<div class="section-title" style="margin-top:4px">My Salary Slip</div>`;
    const curS = generateMonthlySalary(currentUser, fm.mi, fm.y);
    const barH = FY_MONTHS.map((f,i) => {
      if (i > activeSalaryMonth) return 0;
      return generateMonthlySalary(currentUser, f.mi, f.y).gross;
    });
    const maxBar = Math.max(...barH, 1);
    html += `<div class="ytd-card fade-in">
      <div class="ytd-label">My Salary — FY 2025–26</div>
      <div class="ytd-amount">&#8377;${curS.net.toLocaleString('en-IN')}</div>
      <div class="ytd-chart">${barH.map((h,i) => `<div class="ytd-bar${i===activeSalaryMonth?' current':''}" style="height:${Math.round(h/maxBar*100)}%"></div>`).join('')}</div>
      <div class="ytd-months"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span></div>
    </div>`;
    html += pills;

    FY_MONTHS.forEach((f, i) => {
      if (i > activeSalaryMonth + 1) return;
      const s = generateMonthlySalary(currentUser, f.mi, f.y);
      html += `<div class="salary-item fade-in" onclick="togglePayslipDetail(this)">
        <div class="salary-month"><span class="m">${f.m}</span><span class="y">${f.y}</span></div>
        <div class="salary-info"><h4>${currentUser.name}</h4><p>${currentUser.code} &middot; ${currentUser.dept} &middot; ${s.workedDays} days</p></div>
        <div class="salary-net"><div class="value">&#8377;${s.net.toLocaleString('en-IN')}</div><div class="label">Net Pay</div></div>
        <button class="download-btn">${dlBtnSvg}</button>
        <div class="payslip-detail">
          <div class="ps-section">
            <div class="ps-title">Earnings</div>
            <div class="ps-row"><span class="ps-label">Basic Salary</span><span class="ps-val">&#8377;${s.basic.toLocaleString('en-IN')}</span></div>
            <div class="ps-row"><span class="ps-label">HRA</span><span class="ps-val">&#8377;${s.hra.toLocaleString('en-IN')}</span></div>
            <div class="ps-row"><span class="ps-label">Dearness Allowance</span><span class="ps-val">&#8377;${s.da.toLocaleString('en-IN')}</span></div>
            <div class="ps-row"><span class="ps-label">Other Allowance</span><span class="ps-val">&#8377;${s.otherAllow.toLocaleString('en-IN')}</span></div>
            <div class="ps-row"><span class="ps-label">Special Allowance</span><span class="ps-val">&#8377;${s.specialAllow.toLocaleString('en-IN')}</span></div>
            <div class="ps-row ps-total"><span class="ps-label">Gross Salary</span><span class="ps-val">&#8377;${s.gross.toLocaleString('en-IN')}</span></div>
          </div>
          <div class="ps-section">
            <div class="ps-title">Deductions</div>
            <div class="ps-row ps-deduction"><span class="ps-label">Provident Fund (6%)</span><span class="ps-val">- &#8377;${s.pf.toLocaleString('en-IN')}</span></div>
            <div class="ps-row ps-deduction"><span class="ps-label">ESI (2%)</span><span class="ps-val">- &#8377;${s.esi.toLocaleString('en-IN')}</span></div>
            <div class="ps-row ps-deduction"><span class="ps-label">Professional Tax (2%)</span><span class="ps-val">- &#8377;${s.profTax.toLocaleString('en-IN')}</span></div>
            <div class="ps-row ps-total"><span class="ps-label">Total Deductions</span><span class="ps-val" style="color:var(--danger)">- &#8377;${s.totalDed.toLocaleString('en-IN')}</span></div>
          </div>
          <div class="ps-section">
            <div class="ps-row ps-total" style="font-size:.85rem"><span class="ps-label">Net Pay</span><span class="ps-val">&#8377;${s.net.toLocaleString('en-IN')}</span></div>
          </div>
          <div class="ps-actions">
            <button class="ps-dl-btn download-btn" style="width:auto;height:auto;border-radius:var(--radius-xs)">${dlBtnSvg} Download PDF</button>
          </div>
        </div>
      </div>`;
    });
    html += `<div class="card fade-in" style="margin-top:14px;padding:14px;background:var(--primary-50);border:1px solid var(--primary-100)">
      <div class="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div><div style="font-size:.78rem;font-weight:600;color:var(--primary-dark)">Your Salary Account</div><div style="font-size:.68rem;color:var(--primary)">${currentUser.bank} — ${currentUser.accNo} &middot; Payment: NEFT</div></div>
      </div>
    </div>`;
    container.innerHTML = html;
  }
}

// =====================================================
// CORE UI FUNCTIONS
// =====================================================
function _retriggerFadeIn(screen) {
  // Force re-trigger CSS fade-in animations on screen and its children
  screen.querySelectorAll('.fade-in').forEach(function(el) {
    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = '';
  });
  // Re-trigger screen's own fadeUp animation
  screen.style.animation = 'none';
  screen.offsetHeight;
  screen.style.animation = '';
}

function switchTab(id, el, _fromPopstate) {
  // Close all open overlays first — track if any were open
  var hadOverlays = document.querySelectorAll('.overlay-screen.active').length > 0;
  document.querySelectorAll('.overlay-screen.active').forEach(o => { o.classList.remove('active'); o.removeAttribute('style'); });
  document.querySelectorAll('.leave-form-overlay.active').forEach(o => o.classList.remove('active'));

  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + id);
  if (current && current !== next) {
    current.classList.add('fade-out');
    setTimeout(() => {
      current.classList.remove('active', 'fade-out');
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      next.classList.add('active');
      _retriggerFadeIn(next);
      if(el) el.classList.add('active');
      document.querySelector('.app-content').scrollTop = 0;
    }, 150);
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    next.classList.add('active');
    _retriggerFadeIn(next);
    if(el) el.classList.add('active');
    document.querySelector('.app-content').scrollTop = 0;
  }
  if (!_fromPopstate) {
    if (hadOverlays) {
      // Replace the orphaned overlay history entry instead of pushing on top of it
      history.replaceState({ tab: id }, '');
    } else {
      history.pushState({ tab: id }, '');
    }
  }
  // Save current page for reload persistence
  sessionStorage.setItem('hrms_current_tab', id);
  sessionStorage.removeItem('hrms_current_overlay');
  sessionStorage.setItem('hrms_current_navId', _activeNavId);
  if (id === 'advance' || id === 'site' || id === 'ta') { renderAllMyRequests(); renderAllPendingBanners(); }
  if (id === 'site-expense') renderSiteExpenseScreen();
  if (id === 'travel-expense') renderTravelExpenseScreen();
  if (id === 'leaves') renderLeaveScreenForMode();
  if (id === 'progress') renderProgressScreen();
  if (id === 'attendance') { renderAttendanceView(); loadMissedAttRequests(); }
  if (id === 'salary') renderSalaryView();
  updateNavActiveState();
}
let _overlayPreviousFocus = [];
function showOverlay(id) {
  if (id === 'superadmin' && !_isSuperAdmin && currentUser.role !== 'MD') return;
  if (id === 'admin' && currentUser.role !== 'MD' && currentUser.role !== 'HR') return;
  if (id === 'location' && currentUser.role !== 'MD') return;
  if (id === 'peb' && currentUser.role !== 'MD' && currentUser.role !== 'HR' && !(['Site Engineer','Admin','Accounts','Execution','Production'].indexOf(currentUser.dept) >= 0)) return;
  if (id === 'onboarding' && currentUser.role !== 'MD' && currentUser.role !== 'HR' && currentUser.role !== 'Manager') return;
  if (id === 'advance-requests' && currentUser.role !== 'MD' && currentUser.role !== 'HR' && currentUser.role !== 'Manager' && currentUser.role !== 'Accounts') return;
  // Render content (wrapped in try-catch so errors don't block overlay display)
  try {
    if (id === 'profile') renderProfileOverlay();
    if (id === 'admin') renderAdminPanel();
    if (id === 'superadmin') renderSuperAdminPage();
    if (id === 'onboarding') resetWizard();
    if (id === 'notifications') renderNotifications();
    if (id === 'location') openLocationTracker();
    if (id === 'advance-requests') { advReqActiveTab = 'pending'; advReqTypeFilter = 'all'; advReqSearchQuery = ''; var srch = document.getElementById('advReqSearch'); if (srch) srch.value = ''; renderAdvanceRequests('pending'); document.querySelectorAll('#advReqTabs .tab-pill').forEach((p,i) => p.classList.toggle('active', i===0)); document.querySelectorAll('#advReqTypeFilter .loc-filter-chip').forEach((c,i) => c.classList.toggle('active', i===0)); }
    if (id === 'settings') initSettingsToggles();
    if (id === 'accounts-payments') renderAccountsPayments();
    if (id === 'peb') renderPebOverlay();
    if (id === 'hr-recruit') {
      var el = document.getElementById('hrRecruitContent');
      if (el) {
        if (_activeNavId === 'hr-rec-pipeline') el.dataset.rtab = 'pipeline';
        else el.dataset.rtab = 'postings';
      }
      renderRecruitmentOverlay();
    }
  } catch(e) { console.error('Overlay render error:', id, e); }
  // Close any currently active overlays to prevent split-screen stacking
  document.querySelectorAll('.overlay-screen.active').forEach(function(o) {
    o.classList.remove('active');
    o.removeAttribute('style');
  });
  _overlayPreviousFocus.push(document.activeElement);
  var el = document.getElementById('overlay-' + id);
  if (!el) return;
  el.classList.add('active');
  // Force full-screen inline styles — prevents split-screen on all devices
  _forceOverlayFullScreen(el);
  // Save for reload persistence
  sessionStorage.setItem('hrms_current_overlay', id);
  sessionStorage.setItem('hrms_current_navId', _activeNavId);
  try { history.pushState({ overlay: id }, ''); } catch(e) { /* ignore */ }
  // Focus first focusable element
  var focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
}
// Force overlay to cover entire viewport via inline styles (beats all CSS)
function _forceOverlayFullScreen(el) {
  var s = el.style;
  s.setProperty('position', 'fixed', 'important');
  s.setProperty('top', '0', 'important');
  s.setProperty('left', '0', 'important');
  s.setProperty('right', '0', 'important');
  s.setProperty('bottom', '0', 'important');
  s.setProperty('width', '100%', 'important');
  s.setProperty('height', '100%', 'important');
  s.setProperty('max-width', 'none', 'important');
  s.setProperty('max-height', 'none', 'important');
  s.setProperty('margin', '0', 'important');
  s.setProperty('z-index', '99999', 'important');
  s.setProperty('display', 'block', 'important');
  s.setProperty('transform', 'none', 'important');
  s.setProperty('transition', 'none', 'important');
  s.setProperty('overflow-y', 'auto', 'important');
  s.setProperty('overflow-x', 'hidden', 'important');
  s.setProperty('background', '#F5F6FA', 'important');
  // Dark mode support
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    s.setProperty('background', '#0F1117', 'important');
  }
}
let _skipPopstate = false;
function hideOverlay(id, _fromPopstate) {
  const el = document.getElementById('overlay-' + id);
  if (el) {
    el.classList.remove('active');
    el.removeAttribute('style');
  }
  sessionStorage.removeItem('hrms_current_overlay');
  const prev = _overlayPreviousFocus.pop();
  if (prev && prev.focus) prev.focus();
  // If called from UI back button (not popstate), go back in history to consume the pushState entry
  if (!_fromPopstate) {
    _skipPopstate = true;
    history.back();
  }
  // If no overlays remain active, ensure the current screen is visible
  const anyActive = document.querySelector('.overlay-screen.active');
  if (!anyActive) {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) activeScreen.scrollTop = 0;
  }
}

// Keyboard navigation — Escape closes topmost overlay, Tab traps focus
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlays = document.querySelectorAll('.overlay-screen.active');
    if (overlays.length > 0) {
      const topOverlay = overlays[overlays.length - 1];
      const id = topOverlay.id.replace('overlay-', '');
      hideOverlay(id);
      e.preventDefault();
    }
  }
  if (e.key === 'Tab') {
    const overlays = document.querySelectorAll('.overlay-screen.active');
    if (overlays.length > 0) {
      const topOverlay = overlays[overlays.length - 1];
      const focusable = topOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    }
  }
});

// Browser back button support — close overlays or navigate tabs
window.addEventListener('popstate', function(e) {
  if (_skipPopstate) { _skipPopstate = false; return; }
  // Don't handle navigation when logged out
  if (!currentUser) return;
  // If an overlay is open, close the topmost one
  var overlays = document.querySelectorAll('.overlay-screen.active');
  if (overlays.length > 0) {
    var topOverlay = overlays[overlays.length - 1];
    var oid = topOverlay.id.replace('overlay-', '');
    hideOverlay(oid, true);
    return;
  }
  // If state has a tab, switch to it
  if (e.state && e.state.tab) {
    switchTab(e.state.tab, document.querySelector('[data-tab="' + e.state.tab + '"]'), true);
    return;
  }
  // No state or orphaned overlay state — navigate to home or let browser exit
  var activeScreen = document.querySelector('.screen.active');
  if (activeScreen && activeScreen.id !== 'screen-home') {
    switchTab('home', document.querySelector('[data-tab="home"]'), true);
    // Re-establish home as the base state so next back exits cleanly
    history.replaceState({ tab: 'home' }, '');
  }
});

function updateGreeting() {
  const now = new Date();
  const h = now.getHours();
  document.getElementById('timeLabel').textContent = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  restoreCheckinStatus();
}
setInterval(updateGreeting, 60000);

var calendarMonth = new Date();
calendarMonth.setDate(1);

function changeCalendarMonth(dir) {
  var now = new Date();
  var next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + dir, 1);
  // Don't go past current month
  if (next.getFullYear() > now.getFullYear() || (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())) return;
  calendarMonth = next;
  buildCalendar();
}

// Shared helper: determine per-day attendance status from real data.
// Returns a map { dayNum: 'present'|'half'|'absent'|'leave'|'holiday' }
// Rules:
//   Sunday           → holiday
//   Has log, ≥8h     → present  (P)
//   Has log, <8h     → half     (H)
//   No log, on leave → leave    (L)
//   No log           → absent   (A)
function _computeCalendarStatuses(logs, empCode, year, month, maxDay) {
  // Group attendance sessions by day number
  var dayData = {};
  logs.forEach(function(row) {
    var ec = row.emp_code || row.empCode || '';
    if (empCode && ec !== empCode) return;
    var d = row.log_date || row.logDate || '';
    if (!d) return;
    var dayNum = parseInt(String(d).substring(String(d).lastIndexOf('-') + 1), 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;
    if (!dayData[dayNum]) dayData[dayNum] = [];
    dayData[dayNum].push({
      checkIn: row.check_in || row.checkIn || null,
      checkOut: row.check_out || row.checkOut || null
    });
  });

  // Build a set of dates that have an approved leave for this employee
  var leaveDates = {};
  if (typeof leaveApplications !== 'undefined' && empCode) {
    leaveApplications.forEach(function(la) {
      if (la.empCode !== empCode) return;
      if (la.status !== 'approved') return;
      // Mark every day in the leave range that falls in this month
      var from = new Date(la.from + 'T00:00:00');
      var to = new Date(la.to + 'T00:00:00');
      for (var ld = new Date(from); ld <= to; ld.setDate(ld.getDate() + 1)) {
        if (ld.getFullYear() === year && ld.getMonth() === month) {
          leaveDates[ld.getDate()] = true;
        }
      }
    });
  }

  var now = new Date();
  var isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  var att = {};
  var dayHoursMap = {};
  for (var dd = 1; dd <= maxDay; dd++) {
    var dow = new Date(year, month, dd).getDay();
    if (dow === 0) { att[dd] = 'holiday'; continue; }
    var ymd = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
    if (publicHolidays[ymd]) { att[dd] = 'holiday'; continue; }
    if (dayData[dd] && dayData[dd].length > 0) {
      var totalMin = 0;
      dayData[dd].forEach(function(s) {
        if (s.checkIn) {
          var start = new Date(s.checkIn).getTime();
          var end;
          if (s.checkOut) {
            end = new Date(s.checkOut).getTime();
          } else if (isCurrentMonth && dd === now.getDate()) {
            // Still active today — count up to current time
            end = Date.now();
          } else {
            // Past day with no checkout → treat as auto-checkout at 9 PM,
            // but cap the credited hours at 8 (480 min) max.
            var autoOut = new Date(year, month, dd, 21, 0, 0).getTime();
            end = Math.min(autoOut, start + 480 * 60000);
          }
          if (end > start) totalMin += (end - start) / 60000;
        }
      });
      // Cap total credited hours at 8 per day (even if logged > 8)
      if (totalMin > 480) totalMin = 480;
      dayHoursMap[dd] = totalMin;
      // ≥ 8 hours → Present, < 8 hours → Half day
      att[dd] = (totalMin >= 480) ? 'present' : 'half';
    } else if (leaveDates[dd]) {
      att[dd] = 'leave';
    } else {
      att[dd] = 'absent';
    }
  }
  return { att: att, dayHours: dayHoursMap, dayData: dayData };
}

// Guard: only the latest buildCalendar call should render. This prevents two
// concurrent async calls from both appending dates → "double calendar" bug.
var _calBuildSeq = 0;

async function buildCalendar() {
  var mySeq = ++_calBuildSeq; // stamp this call
  const c = document.getElementById('calDays');
  if (!c) return;
  var year = calendarMonth.getFullYear();
  var month = calendarMonth.getMonth();
  const now = new Date();
  const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  var maxDay = isCurrentMonth ? now.getDate() : daysInMonth;
  var monthStr = year + '-' + String(month + 1).padStart(2, '0');

  // Fetch REAL attendance data for this month from the API.
  var logs = [];
  if (currentUser) {
    try {
      logs = await apiCall('GET', '/attendance?month=' + monthStr);
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {
      // Fall back to pre-loaded global for current month
      if (isCurrentMonth && typeof attendanceLogs !== 'undefined') {
        logs = attendanceLogs.filter(function(l) { return l.empCode === currentUser.code; }).map(function(l) {
          return { log_date: l.logDate, check_in: l.checkIn, check_out: l.checkOut, emp_code: l.empCode };
        });
      }
    }
  }

  // If another buildCalendar call started while we were awaiting, abandon this one
  if (mySeq !== _calBuildSeq) return;

  var result = _computeCalendarStatuses(logs, currentUser ? currentUser.code : '', year, month, maxDay);
  var att = result.att;

  // Build the entire grid as a string, then set innerHTML ONCE (no incremental +=)
  var html = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(d) { html += '<div class="cal-day-label">'+d+'</div>'; });
  for (var e = 0; e < firstDayOfWeek; e++) { html += '<div class="cal-day"></div>'; }
  var badgeMap = {
    present: {label:'P', cls:'cal-badge-present'},
    absent:  {label:'A', cls:'cal-badge-absent'},
    holiday: {label:'H', cls:'cal-badge-holiday'},
    half:    {label:'H', cls:'cal-badge-half'},
    leave:   {label:'L', cls:'cal-badge-leave'}
  };
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = isCurrentMonth && d === now.getDate();
    var st = d <= maxDay ? (att[d] || '') : '';
    var ymd = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if (!st && publicHolidays[ymd]) st = 'holiday';
    var badge = st && badgeMap[st] ? '<span class="cal-status-badge '+badgeMap[st].cls+'">'+badgeMap[st].label+'</span>' : '';
    var holidayTitle = publicHolidays[ymd] ? ' title="' + escapeAttr(publicHolidays[ymd].name) + '"' : '';
    html += '<div class="cal-day'+(isToday?' today':'')+'"'+holidayTitle+'>'+d+badge+'</div>';
  }
  c.innerHTML = html; // single DOM write — no double-render possible
  // Update month title
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var titleEl = document.getElementById('calMonthTitle');
  if (titleEl) titleEl.textContent = monthNames[month] + ' ' + year;
  renderAttendanceLogList();
}

function initLeaveTabs() {
  // Leave tab switching is now handled by inline onclick="switchLeaveTab()" on each pill
}

function handleBillCapture(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = input.closest('.screen').querySelector('#billPreview') || document.getElementById('billPreview');
      if(preview) { preview.style.display = 'block'; preview.querySelector('img').src = e.target.result; }
      else { alert('Bill captured successfully!'); }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// =====================================================
// ONBOARDING WIZARD
// =====================================================
var empPhotoFile = null;
function previewEmpPhoto(input) {
  if (!input.files || !input.files[0]) return;
  empPhotoFile = input.files[0];
  var box = document.getElementById('photoUploadBox');
  if (!box) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    box.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';
  };
  reader.readAsDataURL(empPhotoFile);
}

function resetWizard() {
  wizardStep = 1;
  updateWizardUI();
  // Clear all form fields
  ['obName','obPhone','obEmail','obDob','obGender','obAddress','obAadhaar','obPan',
   'obCode','obDept','obDesignation','obSubDept','obDoj','obManager','obPassword','obRole',
   'obSalary','obBank','obAccNo','obIfsc','obPayMode',
   'obEmgName','obEmgRelation','obEmgPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
  });
  // Auto-generate employee code (SS prefix)
  const ssCodes = EMPLOYEES.filter(e=>e.code.startsWith('SS') && !e.code.startsWith('SSC')).map(e=>parseInt(e.code.replace('SS',''),10)||0);
  const maxSS = ssCodes.length > 0 ? Math.max.apply(null, ssCodes) : 0;
  document.getElementById('obCode').value = 'SS' + String(maxSS + 1).padStart(3,'0');
  // Populate dept dropdown with custom depts
  const deptSel = document.getElementById('obDept');
  deptSel.innerHTML = '<option value="">Select Dept</option>';
  departments.forEach(d => { deptSel.innerHTML += `<option>${d}</option>`; });
  // Reset document upload statuses
  document.querySelectorAll('.doc-status').forEach(s => s.textContent = '');
}

function updateWizardUI() {
  // Update step indicators
  document.querySelectorAll('.wizard-step').forEach(s => {
    const n = parseInt(s.dataset.step, 10);
    s.classList.remove('active','done');
    if (n === wizardStep) s.classList.add('active');
    else if (n < wizardStep) s.classList.add('done');
  });
  // Show/hide step bodies
  for (let i = 1; i <= 5; i++) {
    document.getElementById('wizStep' + i).classList.toggle('hidden', i !== wizardStep);
  }
  // Nav buttons
  document.getElementById('wizPrevBtn').disabled = wizardStep === 1;
  const nextBtn = document.getElementById('wizNextBtn');
  nextBtn.textContent = wizardStep === 5 ? 'Submit Employee' : 'Next Step';
  if (wizardStep === 5) nextBtn.classList.add('btn-primary');
}

function wizardNav(dir) {
  if (dir === 1 && wizardStep === 5) {
    submitOnboarding();
    return;
  }
  wizardStep = Math.max(1, Math.min(5, wizardStep + dir));
  updateWizardUI();
}

async function submitOnboarding() {
  var name = document.getElementById('obName').value.trim();
  var code = document.getElementById('obCode').value.trim();
  var dept = document.getElementById('obDept').value;
  var designation = document.getElementById('obDesignation').value.trim();
  var salary = parseInt(document.getElementById('obSalary').value, 10) || 0;
  var bank = document.getElementById('obBank').value.trim();
  var accNo = document.getElementById('obAccNo').value.trim();
  var phone = document.getElementById('obPhone').value.trim();
  var doj = document.getElementById('obDoj').value;
  var email = (document.getElementById('obEmail').value || '').trim();
  var dob = (document.getElementById('obDob').value || '');
  var gender = (document.getElementById('obGender').value || '');
  var address = (document.getElementById('obAddress').value || '').trim();
  var aadhaar = (document.getElementById('obAadhaar').value || '').trim();
  var pan = (document.getElementById('obPan').value || '').trim();
  var ifscCode = (document.getElementById('obIfsc').value || '').trim();
  var emergencyContact = (document.getElementById('obEmgName').value || '').trim();
  var emergencyPhone = (document.getElementById('obEmgPhone').value || '').trim();

  if (!name || !code || !dept || !designation) {
    showToast('Please fill all required fields (Name, Code, Dept, Designation)');
    return;
  }

  var obPassword = (document.getElementById('obPassword') || {}).value || 'emp123';
  var obRole = (document.getElementById('obRole') || {}).value || 'Employee';
  // Only MD can set HR role
  if (obRole === 'HR' && currentUser.role !== 'MD') obRole = 'Employee';

  var newEmp = {
    code: code, name: name, dept: dept, designation: designation, salary: salary, bank: bank || '',
    accNo: accNo || '', role: obRole, phone: phone || '', doj: doj || new Date().toISOString().split('T')[0],
    email: email, dob: dob || null, gender: gender, address: address,
    aadhaar: aadhaar, pan: pan, ifscCode: ifscCode,
    emergencyContact: emergencyContact, emergencyPhone: emergencyPhone,
    status: 'Active'
  };
  var submitBtn = document.querySelector('#overlay-onboarding .btn-primary, #overlay-onboarding button[onclick*="submitOnboarding"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.origText = submitBtn.textContent; submitBtn.textContent = 'Saving...'; }
  try {
    await apiCall('POST', '/employees', newEmp);
    // Register user account with specified password
    var loginCreated = true;
    try {
      await apiCall('POST', '/auth/register', { empCode: code, password: obPassword, role: obRole });
    } catch (regErr) {
      loginCreated = false;
    }
    // Upload photo if provided
    if (empPhotoFile) {
      try {
        var formData = new FormData();
        formData.append('file', empPhotoFile);
        formData.append('empCode', code);
        formData.append('docType', 'photo');
        await fetch(API_BASE + '/documents/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + JWT_TOKEN }, body: formData }).then(function(r) { return r.json(); });
      } catch (photoErr) {}
      empPhotoFile = null;
    }
    EMPLOYEES.push(newEmp);
    if (loginCreated) {
      showToast('Employee added successfully! Login credentials created for ' + name + ' (' + code + ')');
    } else {
      showToast('Employee added but login setup failed. Contact MD to create login credentials.', 'warning');
    }
    _submitSuccess(submitBtn);
    setTimeout(function() { hideOverlay('onboarding'); }, 1500);
  } catch (e) {
    _submitError(submitBtn, 'Failed');
    showToast(e.message || 'Error adding employee');
  }
}

// =====================================================
// ADMIN PANEL
// =====================================================
function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('adminRoles').classList.toggle('hidden', tab !== 'roles');
  document.getElementById('adminDepts').classList.toggle('hidden', tab !== 'depts');
  document.getElementById('adminEmpList').classList.toggle('hidden', tab !== 'emplist');
  document.getElementById('adminGeofence').classList.toggle('hidden', tab !== 'geofence');
  var editReqEl = document.getElementById('adminEditRequests');
  if (editReqEl) editReqEl.classList.toggle('hidden', tab !== 'editRequests');
  if (tab === 'geofence') renderGeofenceSites();
  if (tab === 'editRequests') renderEditRequestsPanel('pending');
}

function renderAdminPanel() {
  renderRolesList();
  renderDeptsList();
  renderAllEmpList();
}

// =====================================================
// SUPERADMIN — Access Management
// =====================================================
// Feature catalogue (must match server/routes/admin.js FEATURES)
var SA_FEATURES = [
  { key:'attendance',    label:'Attendance & Check-in',  cat:'Core' },
  { key:'leaves',        label:'Leave Management',       cat:'Core' },
  { key:'advances',      label:'Advance Requests',       cat:'Finance' },
  { key:'expenses',      label:'Expense Claims',         cat:'Finance' },
  { key:'salary',        label:'Salary Statement',       cat:'Finance' },
  { key:'tax',           label:'Form 16 & Tax',          cat:'Finance' },
  { key:'projects',      label:'Project Progress',       cat:'Operations' },
  { key:'tasks',         label:'Task Management',        cat:'Operations' },
  { key:'peb_stock_items',       label:'PEB – Stock Items',         cat:'PEB' },
  { key:'peb_grn',               label:'PEB – GRN (Goods Receipt)', cat:'PEB' },
  { key:'peb_material_requests', label:'PEB – Material Requests',   cat:'PEB' },
  { key:'peb_returns',           label:'PEB – Returns & Scrap',     cat:'PEB' },
  { key:'peb_vendors',           label:'PEB – Vendors',             cat:'PEB' },
  { key:'peb_purchase_indents',  label:'PEB – Purchase Indents',    cat:'PEB' },
  { key:'peb_purchase_orders',   label:'PEB – Purchase Orders',     cat:'PEB' },
  { key:'peb_transport',         label:'PEB – Transport',           cat:'PEB' },
  { key:'recruitment',   label:'Recruitment',            cat:'HR' },
  { key:'kpi',           label:'KPI & Performance',      cat:'HR' },
  { key:'shifts',        label:'Shift Management',       cat:'HR' },
  { key:'exit',          label:'Exit & F&F',             cat:'HR' },
  { key:'compliance',    label:'Compliance & Filings',   cat:'HR' },
  { key:'documents',     label:'Documents',              cat:'General' },
  { key:'assets',        label:'Asset Management',       cat:'General' },
  { key:'events',        label:'Events & Awards',        cat:'General' },
  { key:'announcements', label:'Announcements',          cat:'General' },
  { key:'geofence',      label:'Geofence Sites',         cat:'Admin' },
  { key:'reports',       label:'Reports & Analytics',    cat:'Admin' },
  { key:'admin_panel',   label:'Admin Panel (Roles)',    cat:'Admin' },
  { key:'settings',      label:'Settings',               cat:'Admin' }
];

// Current user's own feature access overrides (loaded on login)
var _myFeatureAccess = {}; // { feature_key: { enabled: bool, level: 'read'|'edit' } }
var _isSuperAdmin = false;

// Load logged-in user's feature access from backend
async function loadMyFeatureAccess() {
  try {
    var data = await apiCall('GET', '/admin/my-access');
    _myFeatureAccess = (data && data.access) || {};
    _isSuperAdmin = !!(data && data.isSuperAdmin);
  } catch (e) { /* non-fatal — no overrides applied */ }
}

// Feature gating: check if the current user has access to a feature.
// Returns { allowed: bool, level: 'read'|'edit' }
// Logic: if feature_access row exists → use it (explicit override by superadmin).
//        if no row → allow by default (existing role-based behaviour).
function checkFeatureAccess(featureKey) {
  if (_isSuperAdmin) return { allowed: true, level: 'edit' }; // superadmin sees everything
  var override = _myFeatureAccess[featureKey];
  if (override !== undefined) {
    return { allowed: override.enabled, level: override.level || 'read' };
  }
  // No explicit override → allow by default (existing role-based nav handles visibility).
  // The actual nav filtering is done by NAV_CONFIG per-role + filterNavByDept,
  // so returning allowed:true here just means "don't add extra restrictions".
  return { allowed: true, level: 'edit' };
}

// Compute default feature access based on role + department.
// Returns { feature_key: { enabled: bool, level: 'read'|'edit' } }
// This mirrors the NAV_CONFIG visibility — if a role's nav doesn't include
// a feature, it's OFF by default. SuperAdmin overrides take precedence.
function _computeRoleDefaults(role, dept) {
  var roleNav = NAV_CONFIG[role] || NAV_CONFIG.Employee;
  // Collect all nav IDs present in this role's config (including children)
  var navIds = {};
  function walkNav(items) {
    items.forEach(function(item) {
      navIds[item.id] = true;
      if (item.children) walkNav(item.children);
    });
  }
  walkNav(roleNav);
  // For each feature, check if ANY mapped nav ID exists in the role's config
  var defaults = {};
  SA_FEATURES.forEach(function(f) {
    var hasAccess = false;
    // Check if any NAV_FEATURE_MAP key that maps to this feature exists in navIds
    Object.keys(NAV_FEATURE_MAP).forEach(function(navId) {
      if (NAV_FEATURE_MAP[navId] === f.key && navIds[navId]) hasAccess = true;
    });
    // Some features are universally available (home, settings, attendance, leaves)
    if (['attendance', 'leaves', 'settings'].indexOf(f.key) >= 0) hasAccess = true;
    // Dept-gated PEB items
    var pebStoreDepts = ['Site Engineer', 'Admin', 'Accounts', 'Execution', 'Production'];
    var pebPurchDepts = ['Accounts', 'Admin'];
    if (f.key === 'peb_stock_items' && pebStoreDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_grn' && pebStoreDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_material_requests' && pebStoreDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_returns' && pebStoreDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_vendors' && pebPurchDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_purchase_indents' && pebPurchDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_purchase_orders' && pebPurchDepts.indexOf(dept) >= 0) hasAccess = true;
    if (f.key === 'peb_transport' && pebStoreDepts.indexOf(dept) >= 0) hasAccess = true;
    defaults[f.key] = { enabled: hasAccess, level: hasAccess ? 'edit' : 'read' };
  });
  return defaults;
}

// Selected employee for access editing
var _saSelectedEmp = null;
var _saEmpAccess = {}; // loaded access for selected employee
var _saRoleDefaults = {}; // computed role defaults for selected employee

function renderSuperAdminPage() {
  var c = document.getElementById('superadminContent');
  if (!c) return;
  var html = '<div class="section-title" style="margin-top:4px">Feature Access Management</div>';
  html += '<p style="font-size:.75rem;color:var(--gray-500);margin-bottom:12px">Select an employee to manage their feature access. Toggle features on/off and set read-only or edit permissions.</p>';

  // Employee selector
  html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">';
  html += '<select id="saEmpSelect" onchange="saSelectEmployee(this.value)" style="flex:1;min-width:180px;padding:8px 12px;border:1.5px solid var(--gray-200);border-radius:var(--radius);font-size:.82rem">';
  html += '<option value="">— Select Employee —</option>';
  EMPLOYEES.filter(function(e) { return e.code !== 'SADMIN' && e.isActive !== false; }).forEach(function(e) {
    var sel = (_saSelectedEmp === e.code) ? ' selected' : '';
    html += '<option value="' + escapeAttr(e.code) + '"' + sel + '>' + escapeHTML(e.name) + ' (' + escapeHTML(e.code) + ') — ' + escapeHTML(e.role) + '</option>';
  });
  html += '</select></div>';

  // Feature access grid (shown when an employee is selected)
  html += '<div id="saFeatureGrid"></div>';
  c.innerHTML = html;
  if (_saSelectedEmp) saRenderFeatureGrid();
}

async function saSelectEmployee(empCode) {
  if (!empCode) { _saSelectedEmp = null; _saEmpAccess = {}; _saRoleDefaults = {}; document.getElementById('saFeatureGrid').innerHTML = ''; return; }
  _saSelectedEmp = empCode;
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  // Compute what this employee's role normally grants
  _saRoleDefaults = emp ? _computeRoleDefaults(emp.role, emp.dept) : {};
  // Fetch any existing SuperAdmin overrides
  try {
    _saEmpAccess = await apiCall('GET', '/admin/access/' + encodeURIComponent(empCode));
    if (!_saEmpAccess || typeof _saEmpAccess !== 'object') _saEmpAccess = {};
  } catch (e) { _saEmpAccess = {}; }
  saRenderFeatureGrid();
}

function saRenderFeatureGrid() {
  var grid = document.getElementById('saFeatureGrid');
  if (!grid || !_saSelectedEmp) return;
  var emp = EMPLOYEES.find(function(e) { return e.code === _saSelectedEmp; });
  if (!emp) { grid.innerHTML = '<div class="nf-empty">Employee not found</div>'; return; }

  var html = '<div class="card" style="padding:16px;margin-bottom:12px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div><h4 style="font-size:.9rem;margin:0">' + escapeHTML(emp.name) + '</h4>';
  html += '<span style="font-size:.72rem;color:var(--gray-500)">' + escapeHTML(emp.code) + ' — ' + escapeHTML(emp.role) + ' — ' + escapeHTML(emp.dept) + '</span></div>';
  html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="saSaveAccess()" style="font-size:.75rem">Save Changes</button>';
  html += '</div>';

  // Group features by category
  var categories = {};
  SA_FEATURES.forEach(function(f) {
    if (!categories[f.cat]) categories[f.cat] = [];
    categories[f.cat].push(f);
  });

  var catColors = { Core:'#3b82f6', Finance:'#10b981', Operations:'#f59e0b', PEB:'#8b5cf6', HR:'#ec4899', General:'#6b7280', Admin:'#ef4444' };

  Object.keys(categories).forEach(function(cat) {
    html += '<div style="margin-bottom:16px">';
    html += '<div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:' + (catColors[cat] || '#6b7280') + ';margin-bottom:6px;border-bottom:1px solid var(--gray-100);padding-bottom:4px">' + cat + '</div>';
    categories[cat].forEach(function(f) {
      var existing = _saEmpAccess[f.key];
      var roleDef = _saRoleDefaults[f.key] || { enabled: false, level: 'read' };
      // Use explicit override if SuperAdmin set one, otherwise use role default
      var isOn = existing !== undefined ? existing.enabled : roleDef.enabled;
      var level = existing !== undefined ? (existing.level || 'read') : roleDef.level;
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-50)">';
      // Feature label
      html += '<div style="flex:1;font-size:.82rem;font-weight:500">' + escapeHTML(f.label) + '</div>';
      // Read / Edit dropdown
      html += '<select id="sa-level-' + f.key + '" style="padding:4px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem;' + (!isOn ? 'opacity:.3;pointer-events:none' : '') + '">';
      html += '<option value="read"' + (level === 'read' ? ' selected' : '') + '>Read Only</option>';
      html += '<option value="edit"' + (level === 'edit' ? ' selected' : '') + '>Full Edit</option>';
      html += '</select>';
      // Toggle switch
      html += '<label class="toggle-switch" style="margin:0"><input type="checkbox" id="sa-toggle-' + f.key + '"' + (isOn ? ' checked' : '') + ' onchange="saToggleFeature(\'' + f.key + '\',this.checked)"><span class="toggle-slider"></span></label>';
      html += '</div>';
    });
    html += '</div>';
  });

  html += '</div>';
  grid.innerHTML = html;
}

function saToggleFeature(key, isOn) {
  var levelEl = document.getElementById('sa-level-' + key);
  if (levelEl) {
    levelEl.style.opacity = isOn ? '' : '.3';
    levelEl.style.pointerEvents = isOn ? '' : 'none';
  }
}

async function saSaveAccess() {
  if (!_saSelectedEmp) return;
  var features = {};
  SA_FEATURES.forEach(function(f) {
    var toggle = document.getElementById('sa-toggle-' + f.key);
    var levelEl = document.getElementById('sa-level-' + f.key);
    features[f.key] = {
      enabled: toggle ? toggle.checked : true,
      level: levelEl ? levelEl.value : 'read'
    };
  });
  try {
    await apiCall('PUT', '/admin/access/' + encodeURIComponent(_saSelectedEmp), { features: features });
    _saEmpAccess = features; // update local cache
    showToast('Saved! Access permissions updated for ' + _saSelectedEmp);
    // Flash the save button green to confirm
    var saveBtn = document.querySelector('#saFeatureGrid .nf-btn-primary');
    if (saveBtn) {
      saveBtn.textContent = 'Saved';
      saveBtn.style.background = '#10b981';
      setTimeout(function() { saveBtn.textContent = 'Save Changes'; saveBtn.style.background = ''; }, 2000);
    }
  } catch (e) {
    showToast(e.message || 'Error saving access');
  }
}

// ===== HR Edit Requests Panel =====
function renderEditRequestsPanel(statusFilter) {
  var container = document.getElementById('editRequestsList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray-400)">Loading...</div>';
  var url = '/edit-requests';
  if (statusFilter) url += '?status=' + statusFilter;
  apiCall('GET', url).then(function(resp) {
    var requests = resp.data || [];
    if (requests.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:.82rem">No ' + (statusFilter || '') + ' edit requests</div>';
      return;
    }
    var html = '';
    requests.forEach(function(r) {
      var sectionLabel = (r.section || '').replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      var dateStr = r.requested_at ? new Date(r.requested_at).toLocaleString() : '';
      html += '<div class="edit-req-card">';
      html += '<div class="req-header">';
      html += '<span class="req-emp">' + escapeHTML(r.emp_name || r.emp_code) + ' <span style="font-weight:400;color:var(--gray-400);font-size:.72rem">(' + escapeHTML(r.emp_code) + ' / ' + escapeHTML(r.emp_dept || '') + ')</span></span>';
      html += '<span class="req-section">' + escapeHTML(sectionLabel) + '</span>';
      html += '</div>';
      html += '<div class="req-reason">' + escapeHTML(r.reason || 'No reason provided') + '</div>';
      html += '<div class="req-date">Requested: ' + escapeHTML(dateStr) + '</div>';
      if (r.status === 'pending') {
        html += '<div class="req-actions">';
        html += '<button class="btn-approve" onclick="approveEditRequest(' + r.id + ')">Approve</button>';
        html += '<button class="btn-reject" onclick="rejectEditRequest(' + r.id + ')">Reject</button>';
        html += '</div>';
      } else {
        var statusClass = r.status === 'approved' ? 'approved' : (r.status === 'rejected' ? 'rejected' : 'pending');
        html += '<div class="edit-request-status ' + statusClass + '">' + escapeHTML(r.status.charAt(0).toUpperCase() + r.status.slice(1));
        if (r.reviewed_by) html += ' by ' + escapeHTML(r.reviewed_by);
        if (r.review_note) html += ' — ' + escapeHTML(r.review_note);
        html += '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  }).catch(function(err) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);font-size:.82rem">Failed to load: ' + escapeHTML(err.message || 'Error') + '</div>';
  });
}

function filterEditRequests(status, btn) {
  document.querySelectorAll('.edit-req-filter').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderEditRequestsPanel(status);
}

function approveEditRequest(id) {
  if (!confirm('Approve this edit request? The employee will be able to modify the locked section.')) return;
  apiCall('PATCH', '/edit-requests/' + id + '/approve', {}).then(function() {
    showToast('Edit request approved');
    renderEditRequestsPanel('pending');
  }).catch(function(err) {
    showToast(err.message || 'Failed to approve', 'error');
  });
}

function rejectEditRequest(id) {
  var note = prompt('Optional rejection reason:');
  apiCall('PATCH', '/edit-requests/' + id + '/reject', { note: note || '' }).then(function() {
    showToast('Edit request rejected');
    renderEditRequestsPanel('pending');
  }).catch(function(err) {
    showToast(err.message || 'Failed to reject', 'error');
  });
}

// Check if current user is a temporary MD (not the original MD001)
function isTemporaryMD(user) {
  if (!user) user = currentUser;
  return user && user.role === 'MD' && user.code !== 'MD001';
}

function renderRolesList() {
  const container = document.getElementById('rolesList');
  const colors = ['#E85D04','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#D62828'];
  container.innerHTML = EMPLOYEES.map((e,i) => {
    const c = colors[i % colors.length];
    const init = e.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    const isMD001 = e.code === 'MD001';
    const tempBadge = (e.role === 'MD' && !isMD001) ? ' <span class="role-badge temp-md">Temp</span>' : '';
    return `<div class="emp-list-item">
      <div class="emp-avatar" style="background:${c}">${init}</div>
      <div class="emp-details">
        <h4><span class="emp-name-link" onclick="event.stopPropagation();showEmployeeDetailModal('${e.code}')">${escapeHTML(e.name)}</span>${tempBadge}</h4>
        <p>${e.code} &middot; ${escapeHTML(e.dept)} &middot; ${escapeHTML(e.designation)}</p>
      </div>
      ${isMD001 ? '<span class="role-badge md" style="font-size:.65rem">Primary MD</span>' :
        (currentUser && currentUser.role === 'MD' ?
        `<select class="emp-role-select" onclick="event.stopPropagation()" onchange="changeRole('${e.code}',this.value)">
        <option value="Employee"${e.role==='Employee'?' selected':''}>Employee</option>
        <option value="HR"${e.role==='HR'?' selected':''}>HR</option>
        <option value="Accounts"${e.role==='Accounts'?' selected':''}>Accounts</option>
        <option value="Manager"${e.role==='Manager'?' selected':''}>Manager</option>
        <option value="MD"${e.role==='MD'?' selected':''}>MD</option>
      </select>` : `<span class="role-badge ${e.role.toLowerCase()}" style="font-size:.65rem">${e.role}</span>`)}
    </div>`;
  }).join('');
}

async function changeRole(empCode, newRole) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  if (emp.code === 'MD001') { showToast('Cannot change the primary MD role'); return; }
  var oldRole = emp.role;
  var confirmMsg = 'Change ' + emp.name + ' role from ' + oldRole + ' to ' + newRole + '?';
  if (newRole === 'MD') {
    confirmMsg += '\n\nNote: This will be a Temporary MD with edit-only access (no delete permissions).';
  }
  if (!confirm(confirmMsg)) {
    renderRolesList();
    return;
  }
  // Disable the select during API call
  var selects = document.querySelectorAll('.emp-role-select');
  selects.forEach(function(s) { s.disabled = true; });
  try {
    await apiCall('PUT', '/employees/' + emp.code, { role: newRole });
    emp.role = newRole;
    // Update currentUser if this is the logged-in user
    if (currentUser && currentUser.code === emp.code) {
      currentUser.role = newRole;
    }
    showToast(emp.name + ' role changed to ' + newRole + (newRole === 'MD' ? ' (Temporary)' : '') + ' successfully!');
    renderRolesList();
  } catch (e) {
    showToast(e.message || 'Error changing role');
    renderRolesList();
  }
}

// Employee Detail Modal — shows full details; editable for MD/HR
function showEmployeeDetailModal(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var ext = getExtendedData(empCode);
  var container = document.getElementById('empDetailModalContent');
  if (!container) return;
  var canEdit = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');

  var colors = ['#E85D04','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#D62828'];
  var idx = EMPLOYEES.indexOf(emp);
  var avatarColor = colors[(idx >= 0 ? idx : 0) % colors.length];
  var init = emp.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();

  var statusBadge = emp.status === 'Inactive'
    ? '<span style="font-size:.6rem;padding:2px 8px;border-radius:8px;background:#EF4444;color:#fff">Inactive</span>'
    : '<span style="font-size:.6rem;padding:2px 8px;border-radius:8px;background:#22C55E;color:#fff">Active</span>';

  var roleBadge = '<span class="role-badge ' + (emp.role || 'employee').toLowerCase() + '">' + escapeHTML(emp.role) + '</span>';
  if (emp.role === 'MD' && emp.code !== 'MD001') {
    roleBadge += ' <span class="role-badge temp-md">Temporary</span>';
  }

  function field(label, value, full) {
    return '<div class="edm-field' + (full ? ' full' : '') + '"><div class="edm-field-label">' + escapeHTML(label) + '</div><div class="edm-field-value">' + escapeHTML(String(value || 'N/A')) + '</div></div>';
  }
  function editField(label, key, value, type, full) {
    var inputType = type || 'text';
    var val = value || '';
    if (key === 'dept') {
      var opts = departments.map(function(d) { return '<option' + (d === val ? ' selected' : '') + '>' + escapeHTML(d) + '</option>'; }).join('');
      return '<div class="edm-field' + (full ? ' full' : '') + '"><div class="edm-field-label">' + escapeHTML(label) + '</div>' +
        '<select class="edm-edit-input" data-field="dept" style="width:100%;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem;background:var(--card-bg);color:var(--text-primary)">' + opts + '</select></div>';
    }
    return '<div class="edm-field' + (full ? ' full' : '') + '"><div class="edm-field-label">' + escapeHTML(label) + '</div>' +
      '<input type="' + inputType + '" class="edm-edit-input" data-field="' + key + '" value="' + escapeHTML(String(val)) + '" style="width:100%;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem;font-family:var(--font-body);background:var(--card-bg);color:var(--text-primary)"></div>';
  }

  var html = '<div class="edm-header">';
  html += '<div class="edm-avatar" style="background:' + avatarColor + '">' + init + '</div>';
  html += '<div class="edm-name">' + escapeHTML(emp.name) + '</div>';
  html += '<div class="edm-subtitle">' + escapeHTML(emp.designation) + ' &middot; ' + escapeHTML(emp.dept) + '</div>';
  html += '<div class="edm-badges">' + roleBadge + statusBadge + '</div>';
  html += '</div>';

  // Basic Info
  html += '<div class="edm-section"><div class="edm-section-title">Basic Information</div><div class="edm-grid">';
  html += field('Employee Code', emp.code);
  if (canEdit) {
    html += editField('Name', 'name', emp.name);
    html += editField('Department', 'dept', emp.dept);
    html += editField('Designation', 'designation', emp.designation);
    html += editField('Date of Joining', 'doj', emp.doj, 'date');
    html += editField('Date of Birth', 'dob', emp.dob || ext.dob, 'date');
    html += editField('Salary', 'salary', emp.salary, 'number');
  } else {
    html += field('Department', emp.dept);
    html += field('Designation', emp.designation);
    html += field('Date of Joining', emp.doj);
    html += field('Salary', emp.salary ? 'Rs.' + Number(emp.salary).toLocaleString('en-IN') : 'N/A');
  }
  html += field('Role', emp.role);
  html += '</div></div>';

  // Contact Info
  html += '<div class="edm-section"><div class="edm-section-title">Contact Information</div><div class="edm-grid">';
  if (canEdit) {
    html += editField('Phone', 'phone', emp.phone);
    html += editField('Email', 'email', emp.email, 'email');
    html += editField('Present Address', 'presentAddress', emp.presentAddress || ext.address, 'text', true);
    html += editField('Permanent Address', 'permanentAddress', emp.permanentAddress, 'text', true);
  } else {
    html += field('Phone', emp.phone);
    html += field('Email', emp.email);
    html += field('Address', emp.presentAddress || ext.address, true);
  }
  html += '</div></div>';

  // Family Info
  html += '<div class="edm-section"><div class="edm-section-title">Family Details</div><div class="edm-grid">';
  if (canEdit) {
    html += editField('Father\'s Name', 'fatherName', emp.fatherName || ext.fatherName);
    html += editField('Father\'s Mobile', 'fatherMobile', emp.fatherMobile);
    html += editField('Mother\'s Name', 'motherName', emp.motherName || ext.motherName);
    html += editField('Mother\'s Mobile', 'motherMobile', emp.motherMobile);
    html += editField('Spouse Name', 'spouseName', emp.spouseName);
    html += editField('Spouse Mobile', 'spouseMobile', emp.spouseMobile);
    html += editField('Blood Group', 'bloodGroup', emp.bloodGroup || ext.bloodGroup);
    html += '<div class="edm-field"><div class="edm-field-label">Marital Status</div><select class="edm-edit-input" data-field="maritalStatus" style="width:100%;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem;background:var(--card-bg);color:var(--text-primary)"><option value="">Select</option><option' + (emp.maritalStatus==='Single'?' selected':'') + '>Single</option><option' + (emp.maritalStatus==='Married'?' selected':'') + '>Married</option><option' + (emp.maritalStatus==='Divorced'?' selected':'') + '>Divorced</option><option' + (emp.maritalStatus==='Widowed'?' selected':'') + '>Widowed</option></select></div>';
  } else {
    html += field('Father\'s Name', emp.fatherName || ext.fatherName);
    html += field('Mother\'s Name', emp.motherName || ext.motherName);
    html += field('Blood Group', emp.bloodGroup || ext.bloodGroup);
  }
  html += '</div></div>';

  // Identity Documents
  html += '<div class="edm-section"><div class="edm-section-title">Identity & Statutory</div><div class="edm-grid">';
  if (canEdit) {
    html += editField('Aadhaar', 'aadhaar', emp.aadhaar || ext.aadhaar);
    html += editField('PAN', 'pan', emp.pan || ext.pan);
    html += editField('UAN (PF)', 'uan', emp.uan || ext.uan);
  } else {
    html += field('Aadhaar', emp.aadhaar || ext.aadhaar);
    html += field('PAN', emp.pan || ext.pan);
    html += field('UAN (PF)', emp.uan || ext.uan);
  }
  html += '</div></div>';

  // Bank Details
  html += '<div class="edm-section"><div class="edm-section-title">Bank Details</div><div class="edm-grid">';
  if (canEdit) {
    html += editField('Bank Name', 'bank', emp.bank);
    html += editField('Account No', 'accNo', emp.accNo);
    html += editField('IFSC Code', 'ifscCode', emp.ifscCode || emp.ifsc_code);
    html += editField('Bank Branch', 'bankBranch', emp.bankBranch || emp.bank_branch);
  } else {
    html += field('Bank', emp.bank || 'N/A');
    html += field('Account No', emp.accNo || 'N/A');
    html += field('IFSC Code', emp.ifscCode || emp.ifsc_code || 'N/A');
    html += field('Bank Branch', emp.bankBranch || emp.bank_branch || 'N/A');
  }
  html += '</div></div>';

  // Education & Experience (editable only)
  if (canEdit) {
    html += '<div class="edm-section"><div class="edm-section-title">Education & Experience</div><div class="edm-grid">';
    html += editField('Qualification', 'qualification', emp.qualification);
    html += editField('Institution', 'institution', emp.institution);
    html += editField('Year of Passing', 'yearOfPassing', emp.yearOfPassing);
    html += editField('Previous Employer', 'previousEmployer', emp.previousEmployer);
    html += editField('Previous Role', 'previousRole', emp.previousRole);
    html += editField('Years of Experience', 'yearsOfExperience', emp.yearsOfExperience, 'number');
    html += '</div></div>';
  }

  // Documents section for MD/HR — loaded asynchronously
  if (canEdit) {
    html += '<div class="edm-section"><div class="edm-section-title">Employee Documents</div><div id="edmDocsList" style="padding:4px 0"><div style="color:var(--gray-400);font-size:.75rem">Loading documents...</div></div></div>';
  }

  // Save button for MD/HR
  if (canEdit) {
    html += '<div style="padding:12px 0;text-align:center"><button class="nf-btn nf-btn-primary" onclick="saveEmployeeDetails(\'' + empCode + '\')" style="min-width:160px">Save Changes</button></div>';
  }

  container.innerHTML = html;
  showOverlay('emp-detail');

  // Load documents for MD/HR
  if (canEdit) {
    apiCall('GET', '/employees/' + empCode + '/documents').then(function(resp) {
      var docsContainer = document.getElementById('edmDocsList');
      if (!docsContainer) return;
      var docs = resp.data || [];
      if (docs.length === 0) {
        docsContainer.innerHTML = '<div style="color:var(--gray-400);font-size:.75rem;padding:8px 0">No documents uploaded yet</div>';
        return;
      }
      var docTypeLabels = { aadhaar_photo: 'Aadhaar Card', pan_photo: 'PAN Card', educational_cert: 'Educational Certificate', bank_passbook: 'Bank Passbook', experience_cert: 'Experience Certificate' };
      var dhtml = '<div class="doc-upload-grid" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">';
      docs.forEach(function(d) {
        var ext = (d.file_path || '').split('.').pop().toLowerCase();
        var isImg = ['jpg','jpeg','png','gif','webp'].indexOf(ext) >= 0;
        var label = docTypeLabels[d.doc_type] || d.doc_name || d.doc_type;
        var docUrl = authUrl(d.file_path);
        dhtml += '<a href="' + escapeHTML(docUrl) + '" target="_blank" style="text-decoration:none" title="' + escapeHTML(label) + '">';
        dhtml += '<div class="doc-upload-card uploaded" style="cursor:pointer">';
        if (isImg) {
          dhtml += '<img class="doc-thumb" src="' + escapeHTML(docUrl) + '" alt="' + escapeHTML(label) + '">';
        } else {
          dhtml += '<div style="height:60px;display:flex;align-items:center;justify-content:center;background:var(--gray-100);border-radius:6px;margin-bottom:4px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>';
        }
        dhtml += '<div class="doc-label" style="font-size:.6rem">' + escapeHTML(label) + '</div>';
        dhtml += '</div></a>';
      });
      dhtml += '</div>';
      docsContainer.innerHTML = dhtml;
    }).catch(function() {
      var docsContainer = document.getElementById('edmDocsList');
      if (docsContainer) docsContainer.innerHTML = '<div style="color:var(--gray-400);font-size:.75rem">Failed to load documents</div>';
    });
  }
}

async function saveEmployeeDetails(empCode) {
  var inputs = document.querySelectorAll('.edm-edit-input');
  var body = {};
  inputs.forEach(function(inp) {
    var key = inp.getAttribute('data-field');
    var val = inp.value.trim();
    if (key && val !== '') body[key] = val;
  });
  if (Object.keys(body).length === 0) { showToast('No changes to save'); return; }
  try {
    await apiCall('PUT', '/employees/' + empCode, body);
    // Update local EMPLOYEES array
    var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
    if (emp) {
      Object.keys(body).forEach(function(k) { emp[k] = body[k]; });
    }
    showToast('Employee details saved successfully');
    hideOverlay('emp-detail');
    // Re-render admin panel if visible
    if (document.getElementById('rolesList')) renderRolesList();
    if (document.getElementById('allEmpList')) renderAllEmpList();
  } catch (e) { showToast(e.message || 'Error saving details'); }
}

function renderDeptsList() {
  const container = document.getElementById('deptsList');
  const deptColors = {'Design':'#E85D04','Marketing':'#D62828','Execution':'#14B8A6','Production':'#22C55E','QS':'#EC4899','Admin':'#2563EB','Accounts':'#D97706'};
  container.innerHTML = departments.map(d => {
    const count = EMPLOYEES.filter(e => e.dept === d).length;
    const color = deptColors[d] || '#9CA3AF';
    const safeId = d.replace(/[^a-zA-Z0-9]/g, '_');
    const dObj = departmentData.find(x => x.name === d);
    const deptId = dObj ? dObj.id : '';
    return `<div class="dept-manage-item" style="cursor:pointer">
      <div style="flex:1;display:flex;align-items:center;gap:8px" onclick="toggleDeptEmployees('${escapeHTML(d)}')">
        <div class="dept-color" style="background:${color}"></div>
        <div class="dept-info"><h4>${escapeHTML(d)}</h4><p>${count} employees</p></div>
      </div>
      <div style="display:flex;gap:4px;align-items:center">
        <button onclick="event.stopPropagation();editDepartment(${deptId},'${escapeAttr(d)}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-secondary)" title="Rename"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <svg class="dept-chevron" id="chevron-${safeId}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" onclick="toggleDeptEmployees('${escapeHTML(d)}')" style="cursor:pointer"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
    <div class="dept-emp-list" id="deptEmps-${safeId}" style="display:none"></div>`;
  }).join('');
}

function toggleDeptEmployees(dept) {
  const safeId = dept.replace(/[^a-zA-Z0-9]/g, '_');
  const container = document.getElementById('deptEmps-' + safeId);
  const chevron = document.getElementById('chevron-' + safeId);
  const item = chevron ? chevron.closest('.dept-manage-item') : null;
  if (!container) return;
  const isOpen = container.style.display !== 'none';
  container.style.display = isOpen ? 'none' : 'block';
  if (item) item.classList.toggle('expanded', !isOpen);
  if (!isOpen && !container.dataset.loaded) {
    const deptColors = {'Design':'#E85D04','Marketing':'#D62828','Execution':'#14B8A6','Production':'#22C55E','QS':'#EC4899','Admin':'#2563EB','Accounts':'#D97706'};
    const color = deptColors[dept] || '#9CA3AF';
    const emps = EMPLOYEES.filter(e => e.dept === dept);
    if (emps.length === 0) { container.innerHTML = '<p style="padding:8px 12px;font-size:.7rem;color:var(--gray-400)">No employees</p>'; }
    else {
      container.innerHTML = emps.map(e => {
        const init = e.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const isInactive = e.status === 'Inactive';
        const statusBadge = isInactive
          ? '<span style="display:inline-block;font-size:.58rem;padding:1px 5px;border-radius:6px;background:#EF4444;color:#fff;margin-left:4px">Inactive</span>'
          : '<span style="display:inline-block;font-size:.58rem;padding:1px 5px;border-radius:6px;background:#22C55E;color:#fff;margin-left:4px">Active</span>';
        return `<div class="emp-list-item" style="${isInactive ? 'opacity:.6' : ''}">
          <div class="emp-avatar" style="background:${color}">${init}</div>
          <div class="emp-details"><h4>${escapeHTML(e.name)}${statusBadge}</h4><p>${e.code} &middot; ${escapeHTML(e.designation)} &middot; &#8377;${e.salary.toLocaleString('en-IN')}</p></div>
        </div>`;
      }).join('');
    }
    container.dataset.loaded = '1';
  }
}

async function addDepartment() {
  const input = document.getElementById('newDeptName');
  const name = input.value.trim();
  if (!name) return;
  if (departments.includes(name)) { showToast('Department already exists'); return; }
  try {
    var result = await apiCall('POST', '/departments', { name: name });
    departments.push(name);
    departmentData.push({ id: result.id, name: name });
    input.value = '';
    renderDeptsList();
    showToast('Department "' + name + '" added successfully');
  } catch (e) {
    showToast(e.message || 'Failed to add department', 'error');
  }
}

async function editDepartment(deptId, currentName) {
  var newName = prompt('Rename department "' + currentName + '" to:', currentName);
  if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
  newName = newName.trim();
  if (departments.includes(newName)) { showToast('Department "' + newName + '" already exists', 'error'); return; }
  try {
    await apiCall('PUT', '/departments/' + deptId, { name: newName });
    // Update local arrays
    var idx = departments.indexOf(currentName);
    if (idx !== -1) departments[idx] = newName;
    var dObj = departmentData.find(function(x) { return x.id === deptId; });
    if (dObj) dObj.name = newName;
    // Update employee dept references locally
    EMPLOYEES.forEach(function(e) { if (e.dept === currentName) e.dept = newName; });
    renderDeptsList();
    if (document.getElementById('allEmpList')) renderAllEmpList();
    showToast('Department renamed to "' + newName + '"');
  } catch (e) {
    showToast(e.message || 'Failed to rename department', 'error');
  }
}

function renderAllEmpList() {
  const container = document.getElementById('allEmpList');
  const colors = ['#E85D04','#D62828','#14B8A6','#22C55E','#EC4899'];
  const isMD = currentUser && currentUser.role === 'MD';
  const canDelete = (isMD && !isTemporaryMD()) || _isSuperAdmin;
  const isHRorMD = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR' || currentUser.role === 'Manager' || _isSuperAdmin);
  let html = '';
  departments.forEach((dept, di) => {
    const emps = EMPLOYEES.filter(e => e.dept === dept);
    if (emps.length === 0) return;
    html += `<div style="margin-top:12px;margin-bottom:6px;font-family:var(--font-display);font-size:.75rem;font-weight:600;color:${colors[di % colors.length]};text-transform:uppercase;letter-spacing:.04em">${dept} (${emps.length})</div>`;
    emps.forEach(e => {
      const init = e.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
      const isInactive = e.status === 'Inactive';
      const statusBadge = isInactive
        ? '<span style="display:inline-block;font-size:.6rem;padding:2px 6px;border-radius:8px;background:#EF4444;color:#fff;margin-left:6px">Inactive</span>'
        : '<span style="display:inline-block;font-size:.6rem;padding:2px 6px;border-radius:8px;background:#22C55E;color:#fff;margin-left:6px">Active</span>';
      let actions = '';
      if (isHRorMD && e.code !== 'MD001') {
        const toggleLabel = isInactive ? 'Activate' : 'Deactivate';
        const toggleColor = isInactive ? '#22C55E' : '#F59E0B';
        actions = `<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
          <button onclick="deactivateEmployee('${e.code}')" style="font-size:.6rem;padding:3px 8px;border:1px solid ${toggleColor};color:${toggleColor};background:transparent;border-radius:6px;cursor:pointer">${toggleLabel}</button>
          <button onclick="resetEmployeePassword('${e.code}')" style="font-size:.6rem;padding:3px 8px;border:1px solid #3B82F6;color:#3B82F6;background:transparent;border-radius:6px;cursor:pointer">Reset Pwd</button>
          ${canDelete ? `<button onclick="deleteEmployeePermanently('${e.code}')" style="font-size:.6rem;padding:3px 8px;border:1px solid #EF4444;color:#EF4444;background:transparent;border-radius:6px;cursor:pointer">Delete</button>` : ''}
        </div>`;
      }
      html += `<div class="emp-list-item" style="${isInactive ? 'opacity:.6' : ''}" ${isHRorMD ? 'onclick="toggleEmpDetail(\'' + e.code + '\', this)"' : ''}>
        <div class="emp-avatar" style="background:${colors[di % colors.length]}">${init}</div>
        <div class="emp-details"><h4>${escapeHTML(e.name)}${statusBadge}</h4><p>${e.code} &middot; ${escapeHTML(e.designation)} &middot; &#8377;${e.salary.toLocaleString('en-IN')}</p>${actions}</div>
        <span class="role-badge ${e.role.toLowerCase()}">${e.role}</span>
      </div>`;
      if (isHRorMD) html += `<div class="emp-detail-expanded" id="empDetail-${e.code}" style="display:none"></div>`;
    });
  });
  container.innerHTML = html;
}

// Extended employee data (dummy fields for existing employees)
var employeeExtendedData = {};
function getExtendedData(code) {
  if (!employeeExtendedData[code]) {
    var seed = 0;
    for (var i = 0; i < code.length; i++) seed += code.charCodeAt(i);
    var bloodTypes = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
    employeeExtendedData[code] = {
      fatherName: 'Mr. ' + (code.charCodeAt(2) > 50 ? 'Kumar' : 'Rajan') + ' ' + String.fromCharCode(65 + (seed % 26)),
      motherName: 'Mrs. ' + (code.charCodeAt(1) > 50 ? 'Lakshmi' : 'Devi') + ' ' + String.fromCharCode(65 + ((seed+3) % 26)),
      bloodGroup: bloodTypes[seed % bloodTypes.length],
      emergencyContact: '98' + String(4200000 + (seed * 137) % 1000000).substring(0,8),
      address: 'No.' + ((seed % 99) + 1) + ', ' + (seed % 2 === 0 ? 'Anna Nagar' : 'KK Nagar') + ', Coimbatore 6410' + String(10 + seed % 90).substring(0,2),
      aadhaar: 'XXXX XXXX ' + String(1000 + seed % 9000),
      pan: 'XXXXX' + String(1000 + (seed * 7) % 9000) + String.fromCharCode(65 + seed % 26),
      uan: '1013' + String(10000000 + (seed * 31) % 90000000),
      esiNo: '31-00-' + String(100000 + (seed * 17) % 900000) + '-000-0001'
    };
  }
  return employeeExtendedData[code];
}

function toggleEmpDetail(code, el) {
  var detailDiv = document.getElementById('empDetail-' + code);
  if (!detailDiv) return;
  if (detailDiv.style.display !== 'none') {
    detailDiv.style.display = 'none';
    return;
  }
  // Collapse any other open detail
  document.querySelectorAll('.emp-detail-expanded').forEach(function(d) { d.style.display = 'none'; });
  renderEmployeeDetailCard(code);
  detailDiv.style.display = 'block';
}

function renderEmployeeDetailCard(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var ext = getExtendedData(empCode);
  var container = document.getElementById('empDetail-' + empCode);
  if (!container) return;

  var html = '<div class="emp-detail-form">';
  html += '<div class="emp-detail-grid">';
  html += empDetailField('Name', emp.name, empCode, 'name');
  html += empDetailField('Code', emp.code, empCode, 'code', true);
  html += empDetailField('Department', emp.dept, empCode, 'dept');
  html += empDetailField('Designation', emp.designation, empCode, 'designation');
  html += empDetailField('Salary', emp.salary, empCode, 'salary');
  html += empDetailField('Bank', emp.bank || 'Indian Bank', empCode, 'bank');
  html += empDetailField('Account No', emp.accNo || 'N/A', empCode, 'accNo');
  html += empDetailField('Phone', emp.phone || 'N/A', empCode, 'phone');
  html += empDetailField('DOJ', emp.doj || 'N/A', empCode, 'doj');
  html += empDetailField('Email', emp.email || 'N/A', empCode, 'email');
  html += empDetailField('Father\'s Name', ext.fatherName, empCode, 'ext_fatherName');
  html += empDetailField('Mother\'s Name', ext.motherName, empCode, 'ext_motherName');
  html += empDetailField('Blood Group', ext.bloodGroup, empCode, 'ext_bloodGroup');
  html += empDetailField('Emergency Contact', ext.emergencyContact, empCode, 'ext_emergencyContact');
  html += empDetailField('Address', ext.address, empCode, 'ext_address');
  html += empDetailField('Aadhaar', ext.aadhaar, empCode, 'ext_aadhaar');
  html += empDetailField('PAN', ext.pan, empCode, 'ext_pan');
  html += empDetailField('UAN', ext.uan, empCode, 'ext_uan');
  html += empDetailField('ESI No', ext.esiNo, empCode, 'ext_esiNo');
  html += '</div>';
  // Documents section
  html += '<div style="margin-top:10px"><div style="font-size:.72rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px">Employee Documents</div><div id="inlineDocsList-' + empCode + '" style="font-size:.7rem;color:var(--gray-400)">Loading documents...</div></div>';
  html += '<div style="display:flex;gap:8px;margin-top:10px">';
  html += '<button class="btn btn-primary" style="font-size:.72rem;padding:6px 14px" onclick="saveEmployeeDetailsInline(\'' + empCode + '\')">Save Changes</button>';
  html += '<button class="btn btn-sm" style="font-size:.72rem;padding:6px 14px" onclick="document.getElementById(\'empDetail-' + empCode + '\').style.display=\'none\'">Close</button>';
  html += '</div></div>';
  container.innerHTML = html;

  // Load documents asynchronously
  apiCall('GET', '/employees/' + empCode + '/documents').then(function(resp) {
    var docsEl = document.getElementById('inlineDocsList-' + empCode);
    if (!docsEl) return;
    var docs = resp.data || [];
    if (docs.length === 0) { docsEl.innerHTML = '<span style="color:var(--gray-400);font-size:.7rem">No documents uploaded</span>'; return; }
    var docTypeLabels = { aadhaar_photo: 'Aadhaar Card', pan_photo: 'PAN Card', educational_cert: 'Educational Certificate', bank_passbook: 'Bank Passbook', experience_cert: 'Experience Certificate' };
    var dhtml = '<div class="doc-upload-grid" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">';
    docs.forEach(function(d) {
      var fext = (d.file_path || '').split('.').pop().toLowerCase();
      var isImg = ['jpg','jpeg','png','gif','webp'].indexOf(fext) >= 0;
      var label = docTypeLabels[d.doc_type] || d.doc_name || d.doc_type;
      var url = typeof authUrl === 'function' ? authUrl(d.file_path) : d.file_path;
      dhtml += '<a href="' + escapeHTML(url) + '" target="_blank" style="text-decoration:none" title="' + escapeHTML(label) + '">';
      dhtml += '<div class="doc-upload-card uploaded" style="cursor:pointer">';
      if (isImg) {
        dhtml += '<img class="doc-thumb" src="' + escapeHTML(url) + '" alt="' + escapeHTML(label) + '">';
      } else {
        dhtml += '<div style="height:50px;display:flex;align-items:center;justify-content:center;background:var(--gray-100);border-radius:6px;margin-bottom:4px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>';
      }
      dhtml += '<div class="doc-label" style="font-size:.58rem">' + escapeHTML(label) + '</div>';
      dhtml += '</div></a>';
    });
    dhtml += '</div>';
    docsEl.innerHTML = dhtml;
  }).catch(function() {
    var docsEl = document.getElementById('inlineDocsList-' + empCode);
    if (docsEl) docsEl.innerHTML = '<span style="color:var(--gray-400);font-size:.7rem">Failed to load documents</span>';
  });
}

function empDetailField(label, value, empCode, fieldKey, readOnly) {
  var id = 'empField-' + empCode + '-' + fieldKey;
  if (fieldKey === 'dept' && !readOnly) {
    var opts = departments.map(function(d) { return '<option' + (d === value ? ' selected' : '') + '>' + escapeHTML(d) + '</option>'; }).join('');
    return '<div class="emp-detail-field">' +
      '<label class="emp-detail-label">' + escapeHTML(label) + '</label>' +
      '<select class="emp-detail-input" id="' + id + '">' + opts + '</select>' +
      '</div>';
  }
  return '<div class="emp-detail-field">' +
    '<label class="emp-detail-label">' + escapeHTML(label) + '</label>' +
    '<input class="emp-detail-input" id="' + id + '" value="' + escapeHTML(String(value)) + '"' + (readOnly ? ' readonly style="opacity:.6"' : '') + '>' +
    '</div>';
}

async function saveEmployeeDetailsInline(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var fields = ['name','dept','designation','salary','bank','accNo','phone','doj','email'];
  var updateData = {};
  fields.forEach(function(f) {
    var input = document.getElementById('empField-' + empCode + '-' + f);
    if (input) {
      var val = input.value.trim();
      if (f === 'salary') val = parseFloat(val) || 0;
      updateData[f] = val;
    }
  });
  // Collect extended fields and map to camelCase keys for the API
  var extFieldMap = {
    fatherName: 'fatherName', motherName: 'motherName', bloodGroup: 'bloodGroup',
    emergencyContact: 'emergencyContact', address: 'presentAddress',
    aadhaar: 'aadhaar', pan: 'pan', uan: 'uan', esiNo: 'esiNo'
  };
  var ext = getExtendedData(empCode);
  Object.keys(extFieldMap).forEach(function(f) {
    var input = document.getElementById('empField-' + empCode + '-ext_' + f);
    if (input) {
      var val = input.value.trim();
      updateData[extFieldMap[f]] = val;
      ext[f] = val;
    }
  });
  if (Object.keys(updateData).length === 0) { showToast('No changes to save'); return; }
  try {
    await apiCall('PUT', '/employees/' + empCode, updateData);
    Object.assign(emp, updateData);
    showToast('Employee details saved');
    // Re-render just the detail card instead of collapsing it
    renderEmployeeDetailCard(empCode);
  } catch (e) { showToast(e.message || 'Error saving employee details'); }
}

// =====================================================
// EMPLOYEE DEACTIVATE / DELETE / RESET PASSWORD
// =====================================================
async function deactivateEmployee(code) {
  var emp = EMPLOYEES.find(function(e) { return e.code === code; });
  if (!emp) return;
  var newStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive';
  if (!confirm((newStatus === 'Inactive' ? 'Deactivate' : 'Re-activate') + ' ' + emp.name + '?')) return;
  try {
    await apiCall('PUT', '/employees/' + code, { status: newStatus });
    emp.status = newStatus;
    renderAllEmpList();
    showToast(emp.name + ' is now ' + newStatus);
  } catch (e) { showToast(e.message || 'Error updating employee status'); }
}

async function deleteEmployeePermanently(code) {
  var allowed = (currentUser && currentUser.role === 'MD' && !isTemporaryMD()) || _isSuperAdmin;
  if (!allowed) { showToast('Only MD or SuperAdmin can delete employees'); return; }
  if (code === 'MD001' || code === 'SADMIN') { showToast('Cannot delete protected account'); return; }
  var emp = EMPLOYEES.find(function(e) { return e.code === code; });
  if (!emp) return;
  var confirmCode = prompt('To permanently delete ' + emp.name + ', type their employee code (' + code + '):');
  if (confirmCode !== code) { showToast('Deletion cancelled — code did not match'); return; }
  try {
    await apiCall('DELETE', '/employees/' + code, {});
    var idx = EMPLOYEES.findIndex(function(e) { return e.code === code; });
    if (idx >= 0) EMPLOYEES.splice(idx, 1);
    renderAllEmpList();
    showToast(emp.name + ' has been permanently deleted');
  } catch (e) { showToast(e.message || 'Error deleting employee'); }
}

async function resetEmployeePassword(code) {
  var emp = EMPLOYEES.find(function(e) { return e.code === code; });
  if (!emp) return;
  if (!confirm('Reset password for ' + emp.name + ' to default (emp123)?')) return;
  try {
    await apiCall('PUT', '/employees/' + code + '/reset-password', {});
    showToast('Password reset for ' + emp.name);
  } catch (e) { showToast(e.message || 'Error resetting password'); }
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================
const _toastQueue = [];
let _toastActive = false;
function showToast(msg) {
  _toastQueue.push(msg);
  if (!_toastActive) _processToastQueue();
}

function showLoadingSpinner(msg) {
  var el = document.getElementById('loadingSpinner');
  if (!el) return;
  var msgEl = document.getElementById('loadingMessage');
  if (msgEl) msgEl.textContent = msg || 'Loading your data...';
  el.classList.remove('hidden');
}
function hideLoadingSpinner() {
  var el = document.getElementById('loadingSpinner');
  if (el) el.classList.add('hidden');
}
function _processToastQueue() {
  if (_toastQueue.length === 0) { _toastActive = false; return; }
  _toastActive = true;
  const msg = _toastQueue.shift();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add('toast-exit');
    t.addEventListener('animationend', () => { t.remove(); _processToastQueue(); }, { once: true });
  }, 2500);
}
// =====================================================
// LIVE LOCATION TRACKER (MD Only)
// =====================================================
const CHENNAI_LOCATIONS = [
  {area:'Porur',lat:13.0382,lng:80.1582},
  {area:'Tambaram',lat:12.9249,lng:80.1000},
  {area:'T.Nagar',lat:13.0418,lng:80.2341},
  {area:'Guindy',lat:13.0067,lng:80.2206},
  {area:'Ambattur',lat:13.1143,lng:80.1548},
  {area:'Chromepet',lat:12.9516,lng:80.1462},
  {area:'Velachery',lat:12.9815,lng:80.2180},
  {area:'Anna Nagar',lat:13.0850,lng:80.2101},
  {area:'Sholinganallur',lat:12.9010,lng:80.2279},
  {area:'Pallavaram',lat:12.9675,lng:80.1491},
  {area:'Kundrathur',lat:12.9984,lng:80.0999},
  {area:'Avadi',lat:13.1145,lng:80.1098},
  {area:'Office - Porur HQ',lat:13.0385,lng:80.1590},
  {area:'Factory - Kundrathur',lat:12.9970,lng:80.1005}
];

let employeeLocations = [];
let locRefreshInterval = null;
let locActiveFilter = 'All';

function generateEmployeeLocations() {
  var today = new Date().toISOString().split('T')[0];
  var logs = (typeof attendanceLogs !== 'undefined' ? attendanceLogs : []);
  employeeLocations = EMPLOYEES.map(function(emp) {
    // Get today's logs for this employee, sorted by time
    var empLogs = logs.filter(function(l) {
      return l.empCode === emp.code && l.timestamp && l.timestamp.startsWith(today);
    }).sort(function(a, b) { return a.timestamp < b.timestamp ? -1 : 1; });

    var lastLog = empLogs.length > 0 ? empLogs[empLogs.length - 1] : null;
    var firstCheckin = empLogs.find(function(l) { return l.type === 'checkin'; });
    var status = 'offline';
    var lat = null, lng = null, area = 'No location', checkInTime = null, checkOutTime = null;
    var minutesAgo = 0;
    var remark = '';
    var geofenceStatus = '';

    if (lastLog) {
      lat = lastLog.lat || null;
      lng = lastLog.lng || null;
      area = lastLog.location || 'Unknown';
      var logTime = new Date(lastLog.timestamp);
      minutesAgo = Math.round((Date.now() - logTime.getTime()) / 60000);

      if (lastLog.type === 'checkin') {
        // Checked in but not checked out — live/online
        var geoCheck = (lat && lng) ? checkGeofence(lat, lng) : { inside: false };
        status = geoCheck.inside ? 'on-site' : 'online';
        geofenceStatus = geoCheck.inside ? 'Inside: ' + geoCheck.location : 'Outside geofence';
      } else {
        // Last action is checkout — offline
        status = 'offline';
        geofenceStatus = 'Checked out';
      }
      remark = lastLog.remark || '';
    }

    // First check-in time (earliest session, whether active or completed)
    if (empLogs.length > 0 && empLogs[0].checkIn) {
      checkInTime = new Date(empLogs[0].checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (firstCheckin) {
      checkInTime = new Date(firstCheckin.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Last checkout time (from completed sessions)
    var lastCheckout = null;
    for (var i = empLogs.length - 1; i >= 0; i--) {
      if (empLogs[i].checkOut) { lastCheckout = empLogs[i]; break; }
    }
    if (lastCheckout) {
      checkOutTime = new Date(lastCheckout.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Total working hours from all sessions
    var totalMinutes = 0;
    empLogs.forEach(function(l) {
      if (l.checkIn) {
        var start = new Date(l.checkIn).getTime();
        var end = l.checkOut ? new Date(l.checkOut).getTime() : Date.now();
        if (end > start) totalMinutes += (end - start) / 60000;
      }
    });
    var totalHoursStr = '';
    if (totalMinutes > 0) {
      var hrs = Math.floor(totalMinutes / 60);
      var mins = Math.round(totalMinutes % 60);
      totalHoursStr = hrs + 'h ' + mins + 'm';
    }

    return {
      code: emp.code,
      name: emp.name,
      dept: emp.dept,
      designation: emp.designation,
      status: status,
      location: { area: area, lat: lat || 0, lng: lng || 0 },
      minutesAgo: minutesAgo,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      totalHours: totalHoursStr,
      geofenceStatus: geofenceStatus,
      remark: remark,
      totalLogs: empLogs.length
    };
  });
}

function getTimeSince(min) {
  if (min < 1) return 'Just now';
  if (min < 60) return min + ' min ago';
  const h = Math.floor(min / 60);
  return h + ' hr' + (h > 1 ? 's' : '') + ' ago';
}

function getStatusColor(status) {
  return {online:'var(--success)',  'on-site':'var(--primary)', idle:'var(--warning)', offline:'var(--gray-400)'}[status] || 'var(--gray-400)';
}

function getAvatarColor(dept) {
  const colors = {Office:'#E85D04', Site:'#D62828', Factory:'#14B8A6', PEB:'#EC4899', Garden:'#22C55E'};
  return colors[dept] || '#E85D04';
}

function renderLocationTracker() {
  var online = employeeLocations.filter(function(e) { return e.status === 'online'; }).length;
  var onSite = employeeLocations.filter(function(e) { return e.status === 'on-site'; }).length;
  var offline = employeeLocations.filter(function(e) { return e.status === 'offline'; }).length;
  var noLog = employeeLocations.filter(function(e) { return e.totalLogs === 0; }).length;

  // Summary bar
  document.getElementById('locSummary').innerHTML =
    '<div class="loc-stat"><span class="dot green"></span>' + (online + onSite) + ' Live</div>' +
    '<div class="loc-stat"><span class="dot blue"></span>' + onSite + ' On-Site</div>' +
    '<div class="loc-stat"><span class="dot gray"></span>' + offline + ' Checked Out</div>' +
    '<div class="loc-stat"><span class="dot orange"></span>' + noLog + ' Not Logged</div>';

  // Filter chips
  var depts = ['All', 'Live Only'].concat(departments);
  document.getElementById('locFilters').innerHTML = depts.map(function(d) {
    return '<button class="loc-filter-chip' + (locActiveFilter === d ? ' active' : '') + '" onclick="filterLocationByDept(\'' + escapeAttr(d) + '\')">' + escapeHTML(d) + '</button>';
  }).join('');

  // Filter employees
  var filtered;
  if (locActiveFilter === 'All') {
    filtered = employeeLocations.slice();
  } else if (locActiveFilter === 'Live Only') {
    filtered = employeeLocations.filter(function(e) { return e.status === 'online' || e.status === 'on-site'; });
  } else {
    filtered = employeeLocations.filter(function(e) { return e.dept === locActiveFilter; });
  }
  // Sort: on-site first, then online, offline with logs, then no logs
  var order = {'on-site': 0, online: 1, offline: 2};
  filtered.sort(function(a, b) {
    var oa = order[a.status] !== undefined ? order[a.status] : 3;
    var ob = order[b.status] !== undefined ? order[b.status] : 3;
    if (oa !== ob) return oa - ob;
    // Within same status, employees with logs first
    return b.totalLogs - a.totalLogs;
  });

  document.getElementById('locEmpCount').textContent = filtered.length + ' employee' + (filtered.length !== 1 ? 's' : '');

  // Employee cards
  document.getElementById('locEmpList').innerHTML = filtered.map(function(emp) {
    var init = (emp.name || '').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
    var statusLabel = emp.status === 'on-site' ? 'On-Site' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1);
    var hasLocation = emp.location.lat !== 0 && emp.location.lng !== 0;
    var coordsHtml = hasLocation
      ? escapeHTML(emp.location.area) + ' &middot; ' + emp.location.lat.toFixed(4) + '&deg;N, ' + emp.location.lng.toFixed(4) + '&deg;E'
      : '<span style="color:var(--gray-400)">No GPS data today</span>';

    var timeHtml = '';
    if (emp.checkIn) timeHtml += '<span style="color:var(--success)">In: ' + escapeHTML(emp.checkIn) + '</span>';
    if (emp.checkOut) timeHtml += (timeHtml ? ' &middot; ' : '') + '<span style="color:var(--danger)">Out: ' + escapeHTML(emp.checkOut) + '</span>';
    if (emp.totalHours) timeHtml += (timeHtml ? ' &middot; ' : '') + '<span style="color:var(--primary);font-weight:600">' + escapeHTML(emp.totalHours) + '</span>';
    if (!timeHtml && emp.totalLogs === 0) timeHtml = '<span style="color:var(--gray-400)">Not logged in today</span>';

    var remarkHtml = '';
    if (emp.remark) remarkHtml = '<div style="font-size:.62rem;color:var(--warning);margin-top:2px">Remark: ' + escapeHTML(emp.remark) + '</div>';
    var geoHtml = '';
    if (emp.geofenceStatus && emp.totalLogs > 0) geoHtml = '<div style="font-size:.62rem;color:' + (emp.geofenceStatus.startsWith('Inside') ? 'var(--success)' : 'var(--danger)') + ';margin-top:1px">' + escapeHTML(emp.geofenceStatus) + '</div>';

    var cardClick = hasLocation ? 'onclick="openEmployeeOnMap(\'' + escapeAttr(emp.name) + '\',' + emp.location.lat + ',' + emp.location.lng + ',\'' + escapeAttr(emp.location.area) + '\',\'' + escapeAttr(emp.status) + '\')"' : '';

    return '<div class="loc-emp-card" ' + cardClick + '>' +
      '<div class="loc-avatar" style="background:' + getAvatarColor(emp.dept) + '">' + init + '</div>' +
      '<div class="loc-info">' +
        '<h4>' + escapeHTML(emp.name) + ' <span style="font-size:.62rem;color:var(--gray-400);font-weight:400">' + escapeHTML(emp.code) + '</span></h4>' +
        '<p>' + escapeHTML(emp.designation) + ' &middot; ' + escapeHTML(emp.dept) + '</p>' +
        '<div class="loc-coords">' + coordsHtml + '</div>' +
        geoHtml + remarkHtml +
      '</div>' +
      '<div class="loc-right">' +
        '<div class="loc-status-badge ' + emp.status + '"><span class="dot"></span>' + statusLabel + '</div>' +
        '<div class="loc-timestamp">' + timeHtml + '</div>' +
      '</div>' +
      (hasLocation ? '<div class="loc-map-link" title="Open in Google Maps"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>' : '') +
    '</div>';
  }).join('');

  // Map dots (clickable — opens Google Maps)
  renderMapDotsClickable(filtered);
}

function renderMapDots(emps) {
  const mapArea = document.getElementById('locMapArea');
  mapArea.querySelectorAll('.loc-map-dot').forEach(d => d.remove());
  const activeLocs = emps.filter(e => e.status !== 'offline');
  const minLat = 12.88, maxLat = 13.13, minLng = 80.08, maxLng = 80.25;
  activeLocs.forEach(emp => {
    const dot = document.createElement('div');
    dot.className = 'loc-map-dot' + (emp.status === 'online' || emp.status === 'on-site' ? ' pulse' : '');
    dot.style.background = getStatusColor(emp.status);
    const top = 100 - ((emp.location.lat - minLat) / (maxLat - minLat)) * 80 - 10;
    const left = ((emp.location.lng - minLng) / (maxLng - minLng)) * 80 + 10;
    dot.style.top = Math.max(5, Math.min(90, top)) + '%';
    dot.style.left = Math.max(5, Math.min(95, left)) + '%';
    dot.title = emp.name + ' — ' + emp.location.area;
    mapArea.appendChild(dot);
  });
}

function filterLocationByDept(dept) {
  locActiveFilter = dept;
  renderLocationTracker();
}

function refreshLocations() {
  generateEmployeeLocations();
  renderLocationTracker();
  document.getElementById('locLastUpdated').textContent = 'Just now';
  showToast('Locations refreshed');
}

function openLocationTracker() {
  generateEmployeeLocations();
  locActiveFilter = 'All';
  renderLocationTracker();
  document.getElementById('locLastUpdated').textContent = 'Just now';
  var elapsed = 0;
  if (locRefreshInterval) clearInterval(locRefreshInterval);
  locRefreshInterval = setInterval(function() {
    elapsed += 15;
    generateEmployeeLocations();
    renderLocationTracker();
    document.getElementById('locLastUpdated').textContent = elapsed < 60 ? elapsed + 's ago' : Math.floor(elapsed / 60) + 'm ago';
  }, 15000);
}

function closeLocationTracker() {
  hideOverlay('location');
  if (locRefreshInterval) { clearInterval(locRefreshInterval); locRefreshInterval = null; }
}

function getLocMapType() {
  return safeStorage.get(STORAGE_KEYS.mapType) || 'k';
}
function setLocMapType(type) {
  safeStorage.set(STORAGE_KEYS.mapType, type);
  var btns = document.querySelectorAll('.map-type-btn');
  btns.forEach(function(b) { b.classList.toggle('active', b.dataset.type === type); });
}

function openEmployeeOnMap(name, lat, lng, area, status) {
  var t = getLocMapType();
  const url = `https://www.google.com/maps?q=${lat},${lng}&z=16&layer=traffic&t=${t}`;
  window.open(url, '_blank');
  showToast(`Opening ${name}'s location on Google Maps`);
}

function viewAllOnGoogleMaps() {
  // Open Google Maps showing all active employees as a directions route or markers
  const active = employeeLocations.filter(e => e.status !== 'offline');
  if (active.length === 0) { showToast('No active employees to show'); return; }

  // Use the office as center, show all active employee locations
  // Google Maps can show multiple markers via Search with center point
  const centerLat = 13.0385, centerLng = 80.1590; // Office Porur HQ
  // Build a URL with the first few active employees as waypoints
  var t = getLocMapType();
  const first = active.slice(0, 10); // Google Maps supports limited waypoints
  if (first.length === 1) {
    const e = first[0];
    window.open(`https://www.google.com/maps?q=${e.location.lat},${e.location.lng}&z=12&layer=traffic&t=${t}`, '_blank');
  } else {
    // Use directions mode: origin = office, destination = last employee, waypoints = rest
    const origin = `${centerLat},${centerLng}`;
    const dest = `${first[first.length - 1].location.lat},${first[first.length - 1].location.lng}`;
    const waypoints = first.slice(0, -1).map(e => `${e.location.lat},${e.location.lng}`).join('|');
    window.open(`https://www.google.com/maps/dir/${origin}/${first.map(e => `${e.location.lat},${e.location.lng}`).join('/')}?layer=traffic&t=${t}`, '_blank');
  }
  showToast('Opening all active locations on Google Maps');
}

// Also allow clicking map dots
function renderMapDotsClickable(emps) {
  var mapArea = document.getElementById('locMapArea');
  mapArea.querySelectorAll('.loc-map-dot').forEach(function(d) { d.remove(); });
  var activeLocs = emps.filter(function(e) { return e.location.lat !== 0 && e.location.lng !== 0 && e.status !== 'offline'; });
  if (activeLocs.length === 0) {
    var label = mapArea.querySelector('.map-label');
    if (label) label.textContent = 'No active locations';
    return;
  }
  // Dynamic bounds from actual coordinates
  var lats = activeLocs.map(function(e) { return e.location.lat; });
  var lngs = activeLocs.map(function(e) { return e.location.lng; });
  var minLat = Math.min.apply(null, lats) - 0.01;
  var maxLat = Math.max.apply(null, lats) + 0.01;
  var minLng = Math.min.apply(null, lngs) - 0.01;
  var maxLng = Math.max.apply(null, lngs) + 0.01;
  // Ensure minimum range
  if (maxLat - minLat < 0.02) { minLat -= 0.01; maxLat += 0.01; }
  if (maxLng - minLng < 0.02) { minLng -= 0.01; maxLng += 0.01; }
  var label = mapArea.querySelector('.map-label');
  if (label) label.textContent = activeLocs.length + ' active on map';
  activeLocs.forEach(function(emp) {
    var dot = document.createElement('div');
    dot.className = 'loc-map-dot' + (emp.status === 'online' || emp.status === 'on-site' ? ' pulse' : '');
    dot.style.background = getStatusColor(emp.status);
    dot.style.cursor = 'pointer';
    var top = 100 - ((emp.location.lat - minLat) / (maxLat - minLat)) * 80 - 10;
    var left = ((emp.location.lng - minLng) / (maxLng - minLng)) * 80 + 10;
    dot.style.top = Math.max(5, Math.min(90, top)) + '%';
    dot.style.left = Math.max(5, Math.min(95, left)) + '%';
    dot.title = emp.name + ' — ' + emp.location.area + ' (Click to open on Google Maps)';
    dot.onclick = function() { openEmployeeOnMap(emp.name, emp.location.lat, emp.location.lng, emp.location.area, emp.status); };
    mapArea.appendChild(dot);
  });
}

// =====================================================
// UNIFIED ADVANCE APPLICATION & APPROVAL (Site / Salary / Travel)
// =====================================================
const ADV_TYPE_LABELS = {site:'Site Advance', salary:'Salary Advance', travel:'Travel Advance', site_expense:'Site Expense', travel_expense:'Travel Expense'};
const ADV_TYPE_ICONS = {site:'\u{1F3D7}', salary:'\u{1F4B0}', travel:'\u{1F699}', site_expense:'\u{1F9FE}', travel_expense:'\u{1F4CB}'};
let advanceRequests = [];
let advNextId = 1;
let advSelectedType = 'site';
let advSelectedUrgency = 'normal';
let advReqActiveTab = 'pending';

function showInlineExpenseForm() {
  var container = document.getElementById('inlineExpenseForm');
  if (!container) return;
  var btn = document.getElementById('newExpenseBtn');
  if (btn) btn.style.display = 'none';
  container.style.display = 'block';
  var html = '<div class="card fade-in" style="padding:14px;margin-top:10px">';
  html += '<h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">New Advance Request</h3>';
  html += '<div class="form-row"><label>Advance Type *</label><select id="inlineExpType" class="nf-select" onchange="toggleInlineExpFields()">';
  html += '<option value="">Select type</option>';
  html += '<option value="site">Site Advance</option>';
  html += '<option value="salary">Salary Advance</option>';
  html += '<option value="travel">Travel Advance</option>';
  html += '</select></div>';
  html += '<div class="form-row"><label>Amount (Rs.) *</label><input type="number" id="inlineExpAmount" placeholder="e.g. 25000"></div>';
  // Site fields
  html += '<div id="inlineFieldsSite" style="display:none">';
  html += '<div class="form-row"><label>Project / Site *</label><select id="inlineSiteProject" class="nf-select"><option value="">Select project</option>';
  if (typeof projects !== 'undefined') { projects.forEach(function(p) { html += '<option>' + escapeHTML(p.name) + '</option>'; }); }
  html += '<option>Other</option></select></div>';
  html += '<div class="form-row"><label>Purpose *</label><select id="inlineSiteCategory" class="nf-select"><option value="">Select purpose</option><option>Site Visit</option><option>Material Purchase</option><option>Supervision</option><option>Labour Payment</option><option>Equipment Hire</option><option>Other</option></select></div>';
  html += '</div>';
  // Salary fields
  html += '<div id="inlineFieldsSalary" style="display:none">';
  html += '<div class="form-row"><label>Reason *</label><select id="inlineSalaryReason" class="nf-select"><option value="">Select reason</option><option>Medical</option><option>Education</option><option>Marriage</option><option>Housing</option><option>Emergency</option><option>Personal</option><option>Other</option></select></div>';
  html += '<div style="font-size:.75rem;color:var(--primary);font-weight:600;margin:4px 0 12px;background:var(--primary-light);padding:8px 10px;border-radius:var(--radius-xs)">Full amount will be deducted from next month\'s salary</div>';
  html += '</div>';
  // Travel fields
  html += '<div id="inlineFieldsTravel" style="display:none">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>From *</label><input type="text" id="inlineTravelFrom" placeholder="e.g. Porur"></div>';
  html += '<div class="form-row"><label>To *</label><input type="text" id="inlineTravelTo" placeholder="e.g. Tambaram"></div>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>Vehicle *</label><select id="inlineTravelVehicle" class="nf-select"><option value="">Select</option><option>Bike</option><option>Car</option><option>Auto</option><option>Bus</option><option>Train</option><option>Other</option></select></div>';
  html += '<div class="form-row"><label>Distance (km)</label><input type="number" id="inlineTravelKm" placeholder="e.g. 25"></div>';
  html += '</div></div>';
  // Common fields
  html += '<div class="form-row"><label>Details (optional)</label><textarea id="inlineExpDetails" rows="2" placeholder="Brief explanation..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div class="section-title" style="font-size:.72rem;margin-bottom:6px">Attach Bill (optional)</div>';
  html += '<div class="camera-zone fade-in" onclick="document.getElementById(\'cameraInput\').click()" style="padding:14px">';
  html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  html += '<p style="font-size:.78rem">Tap to capture bill photo</p>';
  html += '<input type="file" id="cameraInput" accept="image/*" capture="environment" style="display:none" onchange="handleBillCapture(this)">';
  html += '</div>';
  html += '<div id="billPreview" style="display:none;margin-top:8px;text-align:center"><img id="billImg" style="max-width:100%;border-radius:var(--radius);box-shadow:var(--shadow)"><p style="font-size:.72rem;color:var(--success);font-weight:600;margin-top:4px">Bill captured</p></div>';
  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="submitInlineExpense()" style="flex:1">Submit Request</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="hideInlineExpenseForm()">Cancel</button>';
  html += '</div></div>';
  container.innerHTML = html;
}
function toggleInlineExpFields() {
  var type = (document.getElementById('inlineExpType') || {}).value || '';
  var s = document.getElementById('inlineFieldsSite');
  var a = document.getElementById('inlineFieldsSalary');
  var t = document.getElementById('inlineFieldsTravel');
  if (s) s.style.display = type === 'site' ? '' : 'none';
  if (a) a.style.display = type === 'salary' ? '' : 'none';
  if (t) t.style.display = type === 'travel' ? '' : 'none';
}
function updateInlineEmiCalc() {
  // EMI removed — salary advance deducted from next month salary
}
function hideInlineExpenseForm() {
  var container = document.getElementById('inlineExpenseForm');
  if (container) { container.style.display = 'none'; container.innerHTML = ''; }
  var btn = document.getElementById('newExpenseBtn');
  if (btn) btn.style.display = '';
}
async function submitInlineExpense() {
  var typeEl = document.getElementById('inlineExpType');
  var amountEl = document.getElementById('inlineExpAmount');
  if (!typeEl || !typeEl.value) { showToast('Please select an expense type'); return; }
  var type = typeEl.value;
  var amount = parseInt(amountEl.value, 10) || 0;
  if (!amount) { showToast('Please enter the amount'); return; }
  var details = (document.getElementById('inlineExpDetails') || {}).value || '';
  var project = null, category = null, reason = null, emiAmount = null, emiMonths = null;
  var travelFrom = null, travelTo = null, vehicle = null, travelKm = null;
  if (type === 'site') {
    project = (document.getElementById('inlineSiteProject') || {}).value || '';
    category = (document.getElementById('inlineSiteCategory') || {}).value || '';
    if (!project) { showToast('Please select a project/site'); return; }
    if (!category) { showToast('Please select a purpose'); return; }
  } else if (type === 'salary') {
    reason = (document.getElementById('inlineSalaryReason') || {}).value || '';
    if (!reason) { showToast('Please select a reason'); return; }
    emiAmount = amount;
    emiMonths = 1;
  } else if (type === 'travel') {
    travelFrom = (document.getElementById('inlineTravelFrom') || {}).value || '';
    travelTo = (document.getElementById('inlineTravelTo') || {}).value || '';
    vehicle = (document.getElementById('inlineTravelVehicle') || {}).value || '';
    travelKm = parseInt((document.getElementById('inlineTravelKm') || {}).value, 10) || null;
    if (!travelFrom || !travelTo) { showToast('Please enter From and To locations'); return; }
    if (!vehicle) { showToast('Please select a vehicle type'); return; }
  }
  var inlineBtn = document.querySelector('#inlineExpenseForm .nf-btn-primary');
  _submitStart(inlineBtn);
  try {
    var inlinePayload = { type: type, amount: amount, urgency: 'normal' };
    if (reason) inlinePayload.reason = reason;
    if (details) inlinePayload.details = details;
    if (project) inlinePayload.project = project;
    if (category) inlinePayload.category = category;
    if (travelFrom) inlinePayload.travelFrom = travelFrom;
    if (travelTo) inlinePayload.travelTo = travelTo;
    if (vehicle) inlinePayload.vehicle = vehicle;
    if (travelKm) inlinePayload.travelKm = travelKm;
    if (emiAmount) inlinePayload.emiAmount = emiAmount;
    if (emiMonths) inlinePayload.emiMonths = emiMonths;
    var apiRes = await apiCall('POST', '/advances', inlinePayload);
    // HR's own salary advance skips HR step
    var inlineStatus = 'pending';
    if (currentUser.role === 'HR' && type === 'salary') inlineStatus = 'hr_accepted';

    advanceRequests.push({
      id: (apiRes && apiRes.id) || advNextId++,
      type: type, empCode: currentUser.code, empName: currentUser.name, dept: currentUser.dept,
      amount: amount, reason: reason, details: details, project: project, category: category,
      travelFrom: travelFrom, travelTo: travelTo, vehicle: vehicle, travelKm: travelKm,
      emiAmount: emiAmount, emiMonths: emiMonths, urgency: 'normal',
      status: inlineStatus, appliedDate: new Date().toISOString().split('T')[0],
      reviewedBy: inlineStatus === 'hr_accepted' ? currentUser.name + ' (HR - Self)' : null,
      reviewDate: inlineStatus === 'hr_accepted' ? new Date().toISOString().split('T')[0] : null,
      rejectReason: null
    });
    _submitSuccess(inlineBtn);
    showToast(ADV_TYPE_LABELS[type] + ' request submitted for Rs.' + amount.toLocaleString('en-IN') + (inlineStatus === 'hr_accepted' ? ' — sent to MD' : ''));
    setTimeout(function() { hideInlineExpenseForm(); renderAllMyRequests(); renderAllPendingBanners(); }, 1200);
  } catch (e) {
    _submitError(inlineBtn, 'Failed');
    showToast('Error submitting request');
  }
}

function openAdvanceApplyForm(type) {
  type = type || 'salary';
  document.getElementById('advAmount').value = '';
  document.getElementById('advDetails').value = '';
  document.getElementById('advReason').value = '';
  document.getElementById('advSiteProject').value = '';
  document.getElementById('advSiteCategory').value = '';
  document.getElementById('advTravelFrom').value = '';
  document.getElementById('advTravelTo').value = '';
  document.getElementById('advTravelVehicle').value = '';
  document.getElementById('advTravelKm').value = '';
  // Show salary limit
  var limitInfo = document.getElementById('advSalaryLimitInfo');
  if (limitInfo && currentUser) {
    var sal = currentUser.salary || 0;
    limitInfo.textContent = 'Maximum advance: Rs.' + sal.toLocaleString('en-IN') + ' (your monthly salary)';
  }
  setAdvUrgency('normal');
  setAdvType(type);
  showOverlay('advance-apply');
}

function setAdvType(type) {
  advSelectedType = type;
  document.querySelectorAll('.adv-type-option').forEach(btn => {
    btn.classList.toggle('active', btn.onclick.toString().includes("'" + type + "'"));
  });
  document.getElementById('advFieldsSite').style.display = type === 'site' ? '' : 'none';
  document.getElementById('advFieldsSalary').style.display = type === 'salary' ? '' : 'none';
  document.getElementById('advFieldsTravel').style.display = type === 'travel' ? '' : 'none';
  document.getElementById('advApplyTitle').textContent = 'New ' + ADV_TYPE_LABELS[type] + ' Request';
}

function setAdvUrgency(val) {
  advSelectedUrgency = val;
  document.getElementById('advUrgNormal').classList.toggle('active', val === 'normal');
  document.getElementById('advUrgUrgent').classList.toggle('active', val === 'urgent');
}

function updateEmiCalc() {
  // EMI removed — salary advance deducted from next month salary
}

var advBillFiles = [];
function handleBillUpload(input) {
  var preview = document.getElementById('advBillPreview');
  if (!preview || !input.files) return;
  Array.from(input.files).forEach(function(f) {
    advBillFiles.push(f);
    var chip = document.createElement('div');
    chip.style.cssText = 'display:flex;align-items:center;gap:4px;background:var(--primary-50);padding:4px 8px;border-radius:12px;font-size:.68rem;color:var(--primary)';
    chip.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' + escapeHTML(f.name.substring(0, 20));
    preview.appendChild(chip);
  });
  input.value = '';
}

async function submitAdvanceRequest() {
  const amount = parseInt(document.getElementById('advAmount').value, 10) || 0;
  const details = document.getElementById('advDetails').value.trim();
  if (!amount) { showToast('Please enter the amount'); return; }
  // Salary limit validation for salary advance
  if (advSelectedType === 'salary' && currentUser && currentUser.salary && amount > currentUser.salary) {
    showToast('Amount cannot exceed your monthly salary (Rs.' + currentUser.salary.toLocaleString('en-IN') + ')');
    return;
  }

  let reason = null, emiAmount = null, emiMonths = null;
  let project = null, category = null;
  let travelFrom = null, travelTo = null, vehicle = null, travelKm = null;

  if (advSelectedType === 'salary') {
    reason = document.getElementById('advReason').value;
    if (!reason) { showToast('Please select a reason'); return; }
    emiAmount = amount;
    emiMonths = 1;
  } else if (advSelectedType === 'site') {
    project = document.getElementById('advSiteProject').value;
    category = document.getElementById('advSiteCategory').value;
    if (!project) { showToast('Please select a project/site'); return; }
    if (!category) { showToast('Please select a purpose'); return; }
  } else if (advSelectedType === 'travel') {
    travelFrom = document.getElementById('advTravelFrom').value.trim();
    travelTo = document.getElementById('advTravelTo').value.trim();
    vehicle = document.getElementById('advTravelVehicle').value;
    travelKm = parseInt(document.getElementById('advTravelKm').value, 10) || null;
    if (!travelFrom || !travelTo) { showToast('Please enter From and To locations'); return; }
    if (!vehicle) { showToast('Please select a vehicle type'); return; }
  }

  try {
    // Post to backend API — strip null/undefined to avoid validator errors
    var advPayload = { type: advSelectedType, amount: amount, urgency: advSelectedUrgency };
    if (reason) advPayload.reason = reason;
    if (details) advPayload.details = details;
    if (project) advPayload.project = project;
    if (category) advPayload.category = category;
    if (travelFrom) advPayload.travelFrom = travelFrom;
    if (travelTo) advPayload.travelTo = travelTo;
    if (vehicle) advPayload.vehicle = vehicle;
    if (travelKm) advPayload.travelKm = travelKm;
    if (emiAmount) advPayload.emiAmount = emiAmount;
    if (emiMonths) advPayload.emiMonths = emiMonths;
    const apiRes = await apiCall('POST', '/advances', advPayload);

    // HR's own salary advance skips HR step — goes directly to MD
    var initStatus = 'pending';
    if (currentUser.role === 'HR' && advSelectedType === 'salary') initStatus = 'hr_accepted';

    advanceRequests.push({
      id: (apiRes && apiRes.id) || advNextId++,
      type: advSelectedType,
      empCode: currentUser.code,
      empName: currentUser.name,
      dept: currentUser.dept,
      amount, reason, details,
      project, category,
      travelFrom, travelTo, vehicle, travelKm,
      emiAmount, emiMonths,
      urgency: advSelectedUrgency,
      status: initStatus,
      appliedDate: new Date().toISOString().split('T')[0],
      reviewedBy: initStatus === 'hr_accepted' ? currentUser.name + ' (HR - Self)' : null,
      reviewDate: initStatus === 'hr_accepted' ? new Date().toISOString().split('T')[0] : null,
      rejectReason: null
    });

    const typeLabel = ADV_TYPE_LABELS[advSelectedType];
    var advBtn = document.querySelector('#overlay-advance-apply .btn-primary');
    _submitSuccess(advBtn);
    showToast(typeLabel + ' request submitted for \u20B9' + amount.toLocaleString('en-IN') + (initStatus === 'hr_accepted' ? ' — sent to MD' : ''));
    setTimeout(function() { hideOverlay('advance-apply'); }, 1500);
    renderAllMyRequests();
    renderAllPendingBanners();
    refreshNotifications();
  } catch (e) {
    var advBtnE = document.querySelector('#overlay-advance-apply .btn-primary');
    _submitError(advBtnE, 'Failed');
    showToast(e.message || 'Error submitting advance request');
  }
}

function getAdvMeta(r) {
  if (r.type === 'site') return `<strong>${escapeHTML(r.project || '')}</strong>${r.category ? ' &middot; Purpose: ' + escapeHTML(r.category) : ''}${r.details ? ' &middot; ' + escapeHTML(r.details) : ''}`;
  if (r.type === 'salary') return `<strong>${escapeHTML(r.reason || '')}</strong>${r.details ? ' — ' + escapeHTML(r.details) : ''}<br>Deducted from next month salary`;
  if (r.type === 'travel') return `<strong>${escapeHTML(r.travelFrom || '')} \u2192 ${escapeHTML(r.travelTo || '')}</strong> &middot; ${escapeHTML(r.vehicle || '')}${r.travelKm ? ' &middot; ' + r.travelKm + ' km' : ''}${r.details ? '<br>' + escapeHTML(r.details) : ''}`;
  if (r.type === 'site_expense') return `<strong>${escapeHTML(r.project || '')}</strong> &middot; ${escapeHTML(r.category || 'Site Bill')}${r.details ? ' &middot; ' + escapeHTML(r.details) : ''}`;
  if (r.type === 'travel_expense') return `<strong>${escapeHTML(r.travelFrom || '')} \u2192 ${escapeHTML(r.travelTo || '')}</strong> &middot; ${escapeHTML(r.vehicle || '')}${r.travelKm ? ' &middot; ' + r.travelKm + ' km' : ''}${r.details ? '<br>' + escapeHTML(r.details) : ''}`;
  return escapeHTML(r.details) || '';
}

function renderMyRequestsForType(type, containerId) {
  if (!currentUser) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  const myReqs = advanceRequests.filter(r => r.empCode === currentUser.code && r.type === type);
  if (myReqs.length === 0) { container.innerHTML = ''; return; }
  let html = '<div class="section-title">My ' + ADV_TYPE_LABELS[type] + ' Requests</div>';
  myReqs.sort((a, b) => b.id - a.id).forEach(r => {
    const badgeClass = r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
    const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    html += `<div class="adv-request-card ${r.status}">
      <div class="adv-request-header">
        <h4>\u20B9${r.amount.toLocaleString('en-IN')} <span class="adv-urgency ${r.urgency}">${r.urgency}</span></h4>
        <span class="badge-status ${badgeClass}">${statusLabel}</span>
      </div>
      <div class="adv-request-meta">
        ${getAdvMeta(r)}<br>Applied: ${formatAdvDate(r.appliedDate)}
        ${r.reviewedBy ? '<br>Reviewed by: ' + escapeHTML(r.reviewedBy) + ' on ' + formatAdvDate(r.reviewDate) : ''}
        ${r.rejectReason ? '<br><span style="color:var(--danger)">Reason: ' + escapeHTML(r.rejectReason) + '</span>' : ''}
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function renderAllMyRequests() {
  renderMyRequestsForType('salary', 'myAdvanceRequests');
  renderMyRequestsForType('site', 'mySiteRequests');
  renderMyRequestsForType('travel', 'myTravelRequests');
}

function updateBannerForType(type, bannerId, textId, countId) {
  const banner = document.getElementById(bannerId);
  if (!banner || !currentUser) return;
  // HR sees 'pending' to accept, MD sees only 'hr_accepted' to confirm
  var actionable;
  if (currentUser.role === 'MD') {
    actionable = advanceRequests.filter(r => r.status === 'hr_accepted' && r.type === type).length;
  } else {
    actionable = advanceRequests.filter(r => r.status === 'pending' && r.type === type).length;
  }
  document.getElementById(countId).textContent = actionable;
  document.getElementById(textId).textContent = actionable + ' Pending ' + ADV_TYPE_LABELS[type] + (actionable !== 1 ? 's' : '');
  banner.style.display = (currentUser.role === 'MD' || currentUser.role === 'HR') && actionable > 0 ? 'flex' : 'none';
}

function renderAllPendingBanners() {
  updateBannerForType('salary', 'advPendingBanner', 'advPendingText', 'advPendingCount');
  updateBannerForType('site', 'sitePendingBanner', 'sitePendingText', 'sitePendingCount');
  updateBannerForType('travel', 'taPendingBanner', 'taPendingText', 'taPendingCount');
}

// Keep old name for backward compat
function renderAdvancePendingBanner() { renderAllPendingBanners(); }
function renderMyAdvanceRequests() { renderAllMyRequests(); }

let advReqTypeFilter = 'all';
let advReqSearchQuery = '';

function switchAdvReqTab(tab, btn) {
  advReqActiveTab = tab;
  document.querySelectorAll('#advReqTabs .tab-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderAdvanceRequests(tab);
}

function filterAdvReqByType(type, btn) {
  advReqTypeFilter = type;
  document.querySelectorAll('#advReqTypeFilter .loc-filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderAdvanceRequests(advReqActiveTab);
}

function filterAdvReqBySearch(query) {
  advReqSearchQuery = (query || '').toLowerCase().trim();
  renderAdvanceRequests(advReqActiveTab);
}

function renderAdvanceRequests(filter) {
  const container = document.getElementById('advReqList');
  // Render Excel export buttons for MD/Accounts (visible only for these reviewer roles)
  _renderAdvExportBar(filter);
  // Combine advance requests + expense reimbursements (mapped to same shape)
  // Status mapping handles both new (accounts_accepted/Paid) and legacy (hr_accepted) values.
  var expItems = expenseReimbursements.filter(function(e) {
    return e.expenseType === 'site_expense' || e.expenseType === 'travel_expense';
  }).map(function(e) {
    var s = String(e.status || '').toLowerCase();
    var mappedStatus =
      s === 'approved'                    ? 'approved'           :
      s === 'rejected'                    ? 'rejected'           :
      s === 'paid'                        ? 'paid'               :
      s === 'accounts_accepted'           ? 'accounts_accepted'  :
      s === 'hr_accepted'                 ? 'accounts_accepted'  :  // legacy → treat as accounts_accepted
                                            'pending';
    return {
      id: e.id, _isExpense: true, type: e.expenseType || 'site_expense',
      empCode: e.empCode, empName: e.empName || '', dept: e.dept || '',
      amount: e.amount || 0, reason: null, details: e.description || '',
      project: e.project || null, category: e.category || null,
      travelFrom: e.travelFrom || null, travelTo: e.travelTo || null,
      vehicle: e.vehicle || null, travelKm: e.travelKm || null,
      urgency: 'normal', status: mappedStatus, billUrl: e.billUrl || '',
      appliedDate: e.date || '', reviewedBy: e.approvedBy || e.rejectedBy || null,
      reviewDate: e.approvedOn || null, rejectReason: null
    };
  });
  var allItems = advanceRequests.concat(expItems);
  var isMD = currentUser && currentUser.role === 'MD';
  var isAccounts = currentUser && currentUser.role === 'Accounts';
  var isHR = currentUser && currentUser.role === 'HR';
  var isReviewerRole = isAccounts || isHR;
  let reqs;
  if (filter === 'all') {
    reqs = [...allItems];
  } else if (filter === 'pending') {
    // Accounts/HR sees Pending (to accept) + Approved (to mark Paid).
    // MD sees pending + accounts_accepted (awaiting their confirm).
    if (isMD) {
      reqs = allItems.filter(r => r.status === 'pending' || r.status === 'accounts_accepted');
    } else if (isReviewerRole) {
      reqs = allItems.filter(r => r.status === 'pending' || r.status === 'approved');
    } else {
      reqs = allItems.filter(r => r.status === 'pending');
    }
  } else {
    reqs = allItems.filter(r => r.status === filter);
  }
  if (advReqTypeFilter !== 'all') reqs = reqs.filter(r => r.type === advReqTypeFilter);
  // Search filter
  if (advReqSearchQuery) {
    reqs = reqs.filter(r => {
      var haystack = [r.empName, r.empCode, r.dept, r.details, r.reason, r.category, r.project].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(advReqSearchQuery);
    });
  }
  reqs.sort((a, b) => b.id - a.id);
  if (reqs.length === 0) {
    var emptyMsg = advReqSearchQuery ? 'No results for "' + escapeHTML(advReqSearchQuery) + '"' : 'No ' + filter + ' requests';
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--gray-400);font-size:.82rem">' + emptyMsg + '</div>';
    return;
  }
  var checkSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/></svg>';
  var crossSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var paySvg   = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>';
  container.innerHTML = reqs.map(r => {
    const initials = r.empName ? r.empName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';
    const typeBadge = `<span class="adv-type-badge ${r.type}">${ADV_TYPE_LABELS[r.type] || r.type}</span>`;
    var statusBadge = getAdvanceStatusBadge(r.status);
    var stepHtml = getAdvanceStepIndicator(r.status);
    var actionsHtml = '';

    if (r._isExpense) {
      if (isReviewerRole && r.status === 'pending') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="accountsAcceptExpense(${r.id})">${checkSvg} Accept &amp; Forward to MD</button><button class="reject-btn" onclick="rejectExpense(${r.id})">${crossSvg} Reject</button></div>`;
      } else if (isMD && r.status === 'accounts_accepted') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="approveExpense(${r.id})">${checkSvg} Confirm &amp; Approve</button><button class="reject-btn" onclick="rejectExpense(${r.id})">${crossSvg} Reject</button></div>`;
      } else if (isReviewerRole && r.status === 'approved') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="markExpensePaid(${r.id})" style="background:var(--success);color:#fff">${paySvg} Mark Reimbursed</button></div>`;
      }
    } else {
      if (isReviewerRole && r.status === 'pending') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="accountsAcceptAdvance(${r.id})">${checkSvg} Accept &amp; Forward to MD</button><button class="reject-btn" onclick="rejectAdvance(${r.id})">${crossSvg} Reject</button></div>`;
      } else if (isMD && r.status === 'accounts_accepted') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="approveAdvance(${r.id})">${checkSvg} Confirm &amp; Approve</button><button class="reject-btn" onclick="rejectAdvance(${r.id})">${crossSvg} Reject</button></div>`;
      } else if (isReviewerRole && r.status === 'approved') {
        actionsHtml = `<div class="adv-actions"><button class="approve-btn" onclick="markAdvancePaid(${r.id})" style="background:var(--success);color:#fff">${paySvg} Mark Paid</button></div>`;
      }
    }

    var pdfBtn = '';
    if (isMD || isReviewerRole) {
      var voucherKind = r._isExpense ? 'expenses' : 'advances';
      pdfBtn = '<button onclick="downloadVoucherPDF(\'' + voucherKind + '\',' + r.id + ')" title="Download PDF voucher" style="background:none;border:1px solid var(--gray-200);padding:3px 8px;border-radius:6px;cursor:pointer;font-size:.65rem;color:var(--gray-500);display:inline-flex;align-items:center;gap:3px;margin-left:6px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button>';
    }

    var metaDetails = getAdvMeta(r);
    var billLink = r.billUrl ? '<a href="' + escapeHTML(authUrl(r.billUrl)) + '" target="_blank" style="display:inline-flex;align-items:center;gap:3px;font-size:.7rem;color:var(--primary);font-weight:600;text-decoration:none;margin-top:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>View Attached Bill</a>' : '';

    return `<div class="adv-request-card ${r.status}">
      <!-- Row 1: Employee + Amount + Status -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;background:var(--primary-50);color:var(--primary);font-size:.68rem;font-weight:700">${escapeHTML(initials)}</span>
          <div style="min-width:0">
            <div style="font-size:.85rem;font-weight:700;color:var(--gray-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(r.empName)}</div>
            <div style="font-size:.68rem;color:var(--gray-400);margin-top:1px">${escapeHTML(r.empCode)} &bull; ${escapeHTML(r.dept)}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:.95rem;font-weight:800;color:var(--gray-800)">\u20B9${r.amount.toLocaleString('en-IN')}</div>
          <div style="margin-top:3px">${statusBadge}${pdfBtn}</div>
        </div>
      </div>
      <!-- Row 2: Type + Urgency + Date -->
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px">
        ${typeBadge}
        <span class="adv-urgency ${r.urgency || 'normal'}">${escapeHTML(r.urgency || 'normal')}</span>
        <span style="font-size:.68rem;color:var(--gray-400);margin-left:auto">Applied: ${formatAdvDate(r.appliedDate)}</span>
      </div>
      <!-- Row 3: Details -->
      ${metaDetails ? '<div style="font-size:.73rem;color:var(--gray-600);line-height:1.5;margin-bottom:4px">' + metaDetails + '</div>' : ''}
      ${r.rejectReason ? '<div style="font-size:.7rem;color:var(--danger);margin-bottom:4px">Reject reason: ' + escapeHTML(r.rejectReason) + '</div>' : ''}
      ${r.reviewedBy ? '<div style="font-size:.68rem;color:var(--gray-400);margin-bottom:4px">Reviewed by ' + escapeHTML(r.reviewedBy) + (r.reviewDate ? ' on ' + formatAdvDate(r.reviewDate) : '') + '</div>' : ''}
      ${billLink}
      <!-- Step indicator -->
      <div style="border-top:1px solid var(--gray-100);margin-top:8px;padding-top:8px">${stepHtml}</div>
      ${actionsHtml}
    </div>`;
  }).join('');
}

// Accounts step: Pending → accounts_accepted (forwarded to MD)
async function accountsAcceptAdvance(id) {
  try {
    const req = advanceRequests.find(r => r.id === id);
    if (!req) return;
    await apiCall('PATCH', '/advances/' + id + '/accounts-accept');
    req.status = 'accounts_accepted';
    req.reviewedBy = currentUser.name + ' (Accounts)';
    req.reviewDate = new Date().toISOString().split('T')[0];
    showToast('Accepted \u20B9' + req.amount.toLocaleString('en-IN') + ' — forwarded to MD');
    renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error accepting advance'); }
}

// MD step: accounts_accepted → Approved (then routed back to Accounts for disbursement)
async function approveAdvance(id) {
  try {
    const req = advanceRequests.find(r => r.id === id);
    if (!req) return;
    // MD must wait for Accounts to accept first
    if (currentUser.role === 'MD' && req.status === 'pending') {
      showToast('Accounts must accept this advance first');
      return;
    }
    await apiCall('PATCH', '/advances/' + id + '/approve');
    req.status = 'approved';
    req.reviewedBy = currentUser.name + ' (' + currentUser.role + ')';
    req.reviewDate = new Date().toISOString().split('T')[0];
    showToast('Approved \u20B9' + req.amount.toLocaleString('en-IN') + ' for ' + req.empName + ' — sent back to Accounts to disburse');
    renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error approving advance'); }
}

// Accounts final step: Approved → Paid (records who paid + when)
async function markAdvancePaid(id) {
  try {
    const req = advanceRequests.find(r => r.id === id);
    if (!req) return;
    if (!confirm('Confirm: \u20B9' + req.amount.toLocaleString('en-IN') + ' has been disbursed to ' + req.empName + '?')) return;
    await apiCall('PATCH', '/advances/' + id + '/mark-paid');
    req.status = 'paid';
    showToast('Marked as paid — \u20B9' + req.amount.toLocaleString('en-IN'));
    renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error marking as paid'); }
}

async function rejectAdvance(id) {
  try {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    const req = advanceRequests.find(r => r.id === id);
    if (!req) return;
    await apiCall('PATCH', '/advances/' + id + '/reject', { reason: reason || 'No reason specified' });
    req.status = 'rejected';
    req.reviewedBy = currentUser.name + ' (' + currentUser.role + ')';
    req.reviewDate = new Date().toISOString().split('T')[0];
    req.rejectReason = reason || 'No reason specified';
    showToast('Rejected advance for ' + req.empName);
    renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error rejecting advance'); }
}

// Render the "Download Excel" buttons above the request list — only for MD & Accounts.
// Translates the active UI filter (Pending / Approved / Rejected / All) into the
// query params expected by /api/expenses/export and /api/advances/export.
function _renderAdvExportBar(uiFilter) {
  var bar = document.getElementById('advReqExportBar');
  if (!bar) return;
  var canExport = currentUser && (currentUser.role === 'MD' || currentUser.role === 'Accounts' || currentUser.role === 'HR');
  if (!canExport) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  // Map UI filter → backend status query.
  // For 'pending' we don't pin a single status because reviewers often want all unsettled
  // items in one sheet — leaving status unset returns everything filtered, which Excel
  // can re-filter. For approved/rejected we pin the single status.
  var statusParam = '';
  if (uiFilter === 'approved') statusParam = '&status=Approved';
  else if (uiFilter === 'rejected') statusParam = '&status=Rejected';
  // 'pending' and 'all' → no status filter, lets Accounts see everything
  var dlSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  bar.style.display = 'flex';
  bar.innerHTML =
    '<button class="nf-btn nf-btn-sm" onclick="downloadAdvExport(\'advances\',\'' + uiFilter + '\')" style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem">' + dlSvg + ' Advances (.xlsx)</button>' +
    '<button class="nf-btn nf-btn-sm" onclick="downloadAdvExport(\'expenses\',\'' + uiFilter + '\')" style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem">' + dlSvg + ' Expenses (.xlsx)</button>';
}

// Triggers an authenticated download by hitting the export endpoint with the bearer token
// (server uses verifyToken middleware) and saving the resulting blob.
// NOTE: uses the project's existing API_BASE + JWT_TOKEN globals (defined at line ~6599)
// instead of fetch defaults, so it works with the same auth as apiCall().
async function downloadAdvExport(kind, uiFilter) {
  try {
    var statusQ = '';
    if (uiFilter === 'approved') statusQ = '?status=Approved';
    else if (uiFilter === 'rejected') statusQ = '?status=Rejected';
    var url = API_BASE + '/' + kind + '/export' + statusQ;
    var headers = (typeof apiHeaders === 'function') ? apiHeaders() : (JWT_TOKEN ? { 'Authorization': 'Bearer ' + JWT_TOKEN } : {});
    // Excel endpoint returns a binary buffer; don't send/expect JSON content-type on the response
    delete headers['Content-Type'];
    var res = await fetch(url, { headers: headers });
    if (!res.ok) { showToast('Export failed (' + res.status + ')'); return; }
    var blob = await res.blob();
    var dlUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = dlUrl;
    a.download = kind + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    document.body.appendChild(a); a.click();
    setTimeout(function() { URL.revokeObjectURL(dlUrl); a.remove(); }, 0);
  } catch (e) { showToast('Download error: ' + (e.message || e)); }
}

// Download a single record as a branded PDF voucher (MD/Accounts only — gated by backend).
// kind: 'expenses' | 'advances'
async function downloadVoucherPDF(kind, id) {
  try {
    var url = API_BASE + '/' + kind + '/' + id + '/voucher';
    var headers = (typeof apiHeaders === 'function') ? apiHeaders() : (JWT_TOKEN ? { 'Authorization': 'Bearer ' + JWT_TOKEN } : {});
    delete headers['Content-Type'];
    var res = await fetch(url, { headers: headers });
    if (!res.ok) { showToast('PDF generation failed (' + res.status + ')'); return; }
    var blob = await res.blob();
    var dlUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = dlUrl;
    var prefix = kind === 'expenses' ? 'EXP' : 'ADV';
    a.download = prefix + '-' + String(id).padStart(6, '0') + '.pdf';
    document.body.appendChild(a); a.click();
    setTimeout(function() { URL.revokeObjectURL(dlUrl); a.remove(); }, 0);
  } catch (e) { showToast('PDF download error: ' + (e.message || e)); }
}

function formatAdvDate(dateStr) {
  if (!dateStr) return '';
  // Force local time parsing for YYYY-MM-DD strings to avoid UTC timezone shift
  var s = String(dateStr).substring(0, 10);
  var d = new Date(s + 'T00:00:00');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// =====================================================
// SITE EXPENSE SCREEN — Tally advance vs bills
// =====================================================
function renderSiteExpenseScreen() {
  var container = document.getElementById('siteExpenseContent');
  if (!container || !currentUser) return;
  // Approved site advances for current user
  var myAdvances = advanceRequests.filter(function(a) {
    return a.empCode === currentUser.code && a.type === 'site' && a.status === 'approved';
  });
  var totalAdvance = myAdvances.reduce(function(s, a) { return s + (a.amount || 0); }, 0);
  // Site expense bills submitted by current user
  var myBills = expenseReimbursements.filter(function(e) {
    return e.empCode === currentUser.code && e.expenseType === 'site_expense';
  });
  // Only count non-rejected bills in the tally
  var approvedBills = myBills.filter(function(b) { return b.status !== 'Rejected'; });
  var totalBills = approvedBills.reduce(function(s, b) { return s + (b.amount || 0); }, 0);
  var diff = totalAdvance - totalBills;

  var html = '';
  // Summary cards
  html += '<div class="summary-grid fade-in">';
  html += '<div class="summary-card total"><div class="amount">Rs.' + totalAdvance.toLocaleString('en-IN') + '</div><div class="label">Advance Received</div></div>';
  html += '<div class="summary-card approved"><div class="amount">Rs.' + totalBills.toLocaleString('en-IN') + '</div><div class="label">Bills Submitted</div></div>';
  if (diff > 0) {
    html += '<div class="summary-card pending"><div class="amount">Rs.' + diff.toLocaleString('en-IN') + '</div><div class="label">To Return</div></div>';
  } else if (diff < 0) {
    html += '<div class="summary-card approved"><div class="amount">Rs.' + Math.abs(diff).toLocaleString('en-IN') + '</div><div class="label">Claim Extra</div></div>';
  } else {
    html += '<div class="summary-card approved"><div class="amount">Rs.0</div><div class="label">Settled</div></div>';
  }
  html += '</div>';
  // Tally message
  if (diff > 0) {
    html += '<div style="background:var(--amber-50,#FFF8E1);border:1px solid var(--amber-200,#FFE082);border-radius:var(--radius);padding:10px 12px;margin:10px 0;font-size:.78rem;color:var(--amber-800,#6D4C00)">Return <strong>Rs.' + diff.toLocaleString('en-IN') + '</strong> or it will be deducted from next salary.</div>';
  } else if (diff < 0) {
    html += '<div style="background:var(--success-light);border:1px solid var(--success);border-radius:var(--radius);padding:10px 12px;margin:10px 0;font-size:.78rem;color:var(--success-dark)">You spent <strong>Rs.' + Math.abs(diff).toLocaleString('en-IN') + '</strong> more than advance. Submit for reimbursement approval.</div>';
  }
  // Previously submitted bills
  if (myBills.length > 0) {
    html += '<div class="section-title">Submitted Bills</div>';
    myBills.sort(function(a, b) { return b.id - a.id; }).forEach(function(b) {
      var badgeCls = b.status === 'Approved' ? 'badge-approved' : b.status === 'Rejected' ? 'badge-rejected' : b.status === 'hr_accepted' ? 'badge-pending' : 'badge-pending';
      var statusTxt = b.status === 'hr_accepted' ? 'HR Accepted' : b.status;
      html += '<div class="expense-item fade-in"><div style="flex:1"><div style="font-weight:600;font-size:.82rem">' + escapeHTML(b.category || 'Site Bill') + '</div>';
      html += '<div style="font-size:.72rem;color:var(--gray-500)">' + escapeHTML(b.project || '') + ' &middot; ' + (b.date || '') + '</div>';
      if (b.description) html += '<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">' + escapeHTML(b.description) + '</div>';
      if (b.billUrl) html += '<a href="' + escapeHTML(b.billUrl) + '" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;margin-top:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>View Bill</a>';
      html += '</div><div style="text-align:right"><div class="expense-amount">Rs.' + (b.amount || 0).toLocaleString('en-IN') + '</div>';
      html += '<span class="badge-status ' + badgeCls + '">' + escapeHTML(statusTxt) + '</span></div></div>';
    });
  }
  // New bill form
  html += '<div style="margin-top:14px"><button class="btn btn-primary w-full" style="border-radius:var(--radius)" onclick="showSiteExpenseBillForm()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New Bill</button></div>';
  html += '<div id="siteExpenseBillForm" style="display:none"></div>';
  container.innerHTML = html;
}

function showSiteExpenseBillForm() {
  var container = document.getElementById('siteExpenseBillForm');
  if (!container) return;
  container.style.display = 'block';
  var html = '<div class="card fade-in" style="padding:14px;margin-top:10px">';
  html += '<h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">Submit Site Expense Bill</h3>';
  html += '<div class="form-row"><label>Project / Site *</label><select id="seBillProject" class="nf-select"><option value="">Select project</option>';
  if (typeof projects !== 'undefined') { projects.forEach(function(p) { html += '<option>' + escapeHTML(p.name) + '</option>'; }); }
  html += '<option>Other</option></select></div>';
  html += '<div class="form-row"><label>Category *</label><select id="seBillCategory" class="nf-select"><option value="">Select</option><option>Material</option><option>Labour</option><option>Equipment</option><option>Transport</option><option>Fuel</option><option>Food</option><option>Other</option></select></div>';
  html += '<div class="form-row"><label>Amount (Rs.) *</label><input type="number" id="seBillAmount" placeholder="e.g. 5000"></div>';
  html += '<div class="form-row"><label>Description</label><textarea id="seBillDesc" rows="2" placeholder="Brief explanation..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div class="section-title" style="font-size:.72rem;margin-bottom:6px">Attach Bill Photo *</div>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  html += '<div class="camera-zone fade-in" onclick="document.getElementById(\'seBillInput\').click()" style="padding:14px;flex:1;min-width:120px">';
  html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  html += '<p style="font-size:.78rem">Tap to capture</p>';
  html += '<input type="file" id="seBillInput" accept="image/*,application/pdf" capture="environment" style="display:none" onchange="handleBillPreview(this,\'seBillPreview\')"></div>';
  html += '<button class="btn btn-white-outline" style="padding:14px;flex:1;min-width:120px;display:flex;flex-direction:column;align-items:center;gap:6px" onclick="scanAndUploadGeneric(function(url){document.getElementById(\'seBillUrl\').value=url;document.getElementById(\'seBillPreview\').style.display=\'block\';document.getElementById(\'seBillPreview\').innerHTML=\'<a href=\\\'\'+url+\'\\\' target=\\\'_blank\\\' style=\\\'color:var(--primary);font-size:.75rem\\\'>View uploaded bill</a>\'})">';
  html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>';
  html += '<span style="font-size:.78rem">Scan & Upload</span></button></div>';
  html += '<input type="hidden" id="seBillUrl">';
  html += '<div id="seBillPreview" style="display:none;margin-top:6px"><img style="max-width:100%;border-radius:var(--radius-xs)"></div>';
  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="previewSiteExpenseBill()" style="flex:1">Preview Bill</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="document.getElementById(\'siteExpenseBillForm\').style.display=\'none\'">Cancel</button>';
  html += '</div></div>';
  container.innerHTML = html;
}

function previewSiteExpenseBill() {
  var project = (document.getElementById('seBillProject') || {}).value || '';
  var category = (document.getElementById('seBillCategory') || {}).value || '';
  var amount = parseInt((document.getElementById('seBillAmount') || {}).value, 10) || 0;
  var desc = (document.getElementById('seBillDesc') || {}).value || '';
  var billInput = document.getElementById('seBillInput');
  if (!project) { showToast('Please select a project/site'); return; }
  if (!category) { showToast('Please select a category'); return; }
  if (!amount) { showToast('Please enter the bill amount'); return; }

  // Store form data + file before preview replaces the HTML
  var billFile = (billInput && billInput.files && billInput.files[0]) ? billInput.files[0] : null;
  window._siteExpPreview = { project: project, category: category, amount: amount, desc: desc, billFile: billFile };

  var billPreviewSrc = '';
  var billFileName = '';
  var previewImg = document.querySelector('#seBillPreview img');
  if (previewImg && previewImg.src) billPreviewSrc = previewImg.src;
  if (billFile) billFileName = billFile.name;

  var container = document.getElementById('siteExpenseBillForm');
  if (!container) return;
  var dateLabel = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  var html = '<div class="card fade-in" style="padding:14px;margin-top:10px">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><div style="width:36px;height:36px;border-radius:10px;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:1.2rem">\uD83C\uDFD7</div>';
  html += '<div><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin:0">Preview Site Expense</h3>';
  html += '<p style="font-size:.7rem;color:var(--gray-400);margin:0">Review before submitting</p></div></div>';

  html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:12px;margin-bottom:12px">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.78rem">';
  html += '<div><span style="color:var(--gray-500)">Project/Site:</span><br><strong>' + escapeHTML(project) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Category:</span><br><strong>' + escapeHTML(category) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Amount:</span><br><strong style="color:var(--danger);font-size:.88rem">Rs.' + amount.toLocaleString('en-IN') + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Date:</span><br><strong>' + escapeHTML(dateLabel) + '</strong></div>';
  html += '</div></div>';

  if (desc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">DESCRIPTION</div>';
    html += '<div style="font-size:.78rem;padding:8px;background:var(--gray-50);border-radius:var(--radius-xs)">' + escapeHTML(desc) + '</div></div>';
  }

  if (billPreviewSrc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">ATTACHED BILL' + (billFileName ? ' \u2014 ' + escapeHTML(billFileName) : '') + '</div>';
    html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:8px;text-align:center"><img src="' + billPreviewSrc + '" style="max-width:100%;max-height:300px;border-radius:var(--radius-xs)"></div></div>';
  } else {
    html += '<div style="margin-bottom:12px;padding:8px 10px;background:#fee2e2;border-radius:var(--radius-xs);font-size:.75rem;color:#dc2626;font-weight:600">No bill attached</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="submitSiteExpenseBill()" style="flex:1;font-weight:700">Confirm & Submit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="showSiteExpenseBillForm()" style="flex:1">Edit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="document.getElementById(\'siteExpenseBillForm\').style.display=\'none\'">Cancel</button>';
  html += '</div></div>';
  container.innerHTML = html;
}

async function submitSiteExpenseBill() {
  // Use stored preview data if available (preview replaces form inputs)
  var stored = window._siteExpPreview || {};
  var project = stored.project || (document.getElementById('seBillProject') || {}).value || '';
  var category = stored.category || (document.getElementById('seBillCategory') || {}).value || '';
  var amount = stored.amount || parseInt((document.getElementById('seBillAmount') || {}).value, 10) || 0;
  var desc = stored.desc || (document.getElementById('seBillDesc') || {}).value || '';
  var billFile = stored.billFile || null;
  if (!billFile) { var billInput = document.getElementById('seBillInput'); if (billInput && billInput.files && billInput.files[0]) billFile = billInput.files[0]; }
  if (!project) { showToast('Please select a project/site'); return; }
  if (!category) { showToast('Please select a category'); return; }
  if (!amount) { showToast('Please enter the bill amount'); return; }
  try {
    var fd = new FormData();
    fd.append('category', category);
    fd.append('amount', amount);
    fd.append('description', desc);
    fd.append('date', new Date().toISOString().split('T')[0]);
    fd.append('expenseType', 'site_expense');
    fd.append('project', project);
    if (billFile) fd.append('bill', billFile);
    var apiRes = await apiUpload('/expenses', fd);
    expenseReimbursements.push({
      id: (apiRes && apiRes.id) || (expenseReimbursements.length + 1),
      empCode: currentUser.code, empName: currentUser.name,
      category: category, amount: amount, description: desc, project: project,
      date: new Date().toISOString().split('T')[0], status: 'Pending',
      expenseType: 'site_expense', billUrl: apiRes.billUrl || ''
    });
    var expBtn = document.querySelector('#siteExpenseBillForm .nf-btn-primary');
    _submitSuccess(expBtn);
    window._siteExpPreview = null;
    showToast('Site expense bill submitted for Rs.' + amount.toLocaleString('en-IN'));
    setTimeout(function() { renderSiteExpenseScreen(); }, 1500);
  } catch (e) {
    var expBtnE = document.querySelector('#siteExpenseBillForm .nf-btn-primary');
    _submitError(expBtnE, 'Failed');
    showToast(e.message || 'Error submitting bill');
  }
}

// =====================================================
// TRAVEL EXPENSE SCREEN — Tally travel advance vs bills
// =====================================================
function renderTravelExpenseScreen() {
  var container = document.getElementById('travelExpenseContent');
  if (!container || !currentUser) return;
  // Approved travel advances for current user
  var myAdvances = advanceRequests.filter(function(a) {
    return a.empCode === currentUser.code && a.type === 'travel' && a.status === 'approved';
  });
  var totalAdvance = myAdvances.reduce(function(s, a) { return s + (a.amount || 0); }, 0);
  // Travel expense bills submitted by current user
  var myBills = expenseReimbursements.filter(function(e) {
    return e.empCode === currentUser.code && e.expenseType === 'travel_expense';
  });
  // Only count non-rejected bills in the tally
  var approvedBills = myBills.filter(function(b) { return b.status !== 'Rejected'; });
  var totalBills = approvedBills.reduce(function(s, b) { return s + (b.amount || 0); }, 0);
  var diff = totalAdvance - totalBills;

  var html = '';
  // Summary cards
  html += '<div class="summary-grid fade-in">';
  html += '<div class="summary-card total"><div class="amount">Rs.' + totalAdvance.toLocaleString('en-IN') + '</div><div class="label">Travel Advance</div></div>';
  html += '<div class="summary-card approved"><div class="amount">Rs.' + totalBills.toLocaleString('en-IN') + '</div><div class="label">Bills Submitted</div></div>';
  if (diff > 0) {
    html += '<div class="summary-card pending"><div class="amount">Rs.' + diff.toLocaleString('en-IN') + '</div><div class="label">To Return</div></div>';
  } else if (diff < 0) {
    html += '<div class="summary-card approved"><div class="amount">Rs.' + Math.abs(diff).toLocaleString('en-IN') + '</div><div class="label">Claim Extra</div></div>';
  } else {
    html += '<div class="summary-card approved"><div class="amount">Rs.0</div><div class="label">Settled</div></div>';
  }
  html += '</div>';
  // Tally message
  if (diff > 0) {
    html += '<div style="background:var(--amber-50,#FFF8E1);border:1px solid var(--amber-200,#FFE082);border-radius:var(--radius);padding:10px 12px;margin:10px 0;font-size:.78rem;color:var(--amber-800,#6D4C00)">Return <strong>Rs.' + diff.toLocaleString('en-IN') + '</strong> or it will be deducted from next salary.</div>';
  } else if (diff < 0) {
    html += '<div style="background:var(--success-light);border:1px solid var(--success);border-radius:var(--radius);padding:10px 12px;margin:10px 0;font-size:.78rem;color:var(--success-dark)">You spent <strong>Rs.' + Math.abs(diff).toLocaleString('en-IN') + '</strong> more than advance. Submit for reimbursement approval.</div>';
  }
  // Previous bills
  if (myBills.length > 0) {
    html += '<div class="section-title">Submitted Bills</div>';
    myBills.sort(function(a, b) { return b.id - a.id; }).forEach(function(b) {
      var badgeCls = b.status === 'Approved' ? 'badge-approved' : b.status === 'Rejected' ? 'badge-rejected' : b.status === 'hr_accepted' ? 'badge-pending' : 'badge-pending';
      var statusTxt = b.status === 'hr_accepted' ? 'HR Accepted' : b.status;
      html += '<div class="expense-item fade-in"><div style="flex:1"><div style="font-weight:600;font-size:.82rem">' + escapeHTML(b.travelFrom || '') + ' → ' + escapeHTML(b.travelTo || '') + '</div>';
      html += '<div style="font-size:.72rem;color:var(--gray-500)">' + escapeHTML(b.vehicle || '') + (b.travelKm ? ' &middot; ' + b.travelKm + ' km' : '') + ' &middot; ' + (b.date || '') + '</div>';
      if (b.description) html += '<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">' + escapeHTML(b.description) + '</div>';
      if (b.billUrl) html += '<a href="' + escapeHTML(b.billUrl) + '" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;margin-top:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>View Bill</a>';
      html += '</div><div style="text-align:right"><div class="expense-amount">Rs.' + (b.amount || 0).toLocaleString('en-IN') + '</div>';
      html += '<span class="badge-status ' + badgeCls + '">' + escapeHTML(statusTxt) + '</span></div></div>';
    });
  }
  // New bill form
  html += '<div style="margin-top:14px"><button class="btn btn-primary w-full" style="border-radius:var(--radius)" onclick="showTravelExpenseBillForm()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New Bill</button></div>';
  html += '<div id="travelExpenseBillForm" style="display:none"></div>';
  container.innerHTML = html;
}

function showTravelExpenseBillForm() {
  var container = document.getElementById('travelExpenseBillForm');
  if (!container) return;
  container.style.display = 'block';
  var html = '<div class="card fade-in" style="padding:14px;margin-top:10px">';
  html += '<h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">Submit Travel Expense Bill</h3>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>From *</label><input type="text" id="teBillFrom" placeholder="e.g. Coimbatore"></div>';
  html += '<div class="form-row"><label>To *</label><input type="text" id="teBillTo" placeholder="e.g. Chennai"></div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>Travel Date *</label><input type="date" id="teBillDate" value="' + new Date().toISOString().split('T')[0] + '"></div>';
  html += '<div class="form-row"><label>Days</label><input type="number" id="teBillDays" placeholder="1" value="1"></div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>Mode of Travel *</label><select id="teBillVehicle" class="nf-select"><option value="">Select</option><option>Bike</option><option>Car</option><option>Auto</option><option>Bus</option><option>Train</option><option>Flight</option><option>Other</option></select></div>';
  html += '<div class="form-row"><label>Distance (km)</label><input type="number" id="teBillKm" placeholder="e.g. 500"></div></div>';
  html += '<div class="form-row"><label>Bill Amount (Rs.) *</label><input type="number" id="teBillAmount" placeholder="e.g. 2500"></div>';
  html += '<div class="form-row"><label>Description</label><textarea id="teBillDesc" rows="2" placeholder="Trip details..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div class="section-title" style="font-size:.72rem;margin-bottom:6px">Attach Receipt *</div>';
  html += '<div class="camera-zone fade-in" onclick="document.getElementById(\'teBillInput\').click()" style="padding:14px">';
  html += '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  html += '<p style="font-size:.78rem">Tap to capture receipt</p>';
  html += '<input type="file" id="teBillInput" accept="image/*,application/pdf" capture="environment" style="display:none" onchange="handleBillPreview(this,\'teBillPreview\')"></div>';
  html += '<div id="teBillPreview" style="display:none;margin-top:6px"><img style="max-width:100%;border-radius:var(--radius-xs)"></div>';
  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="previewTravelExpenseBill()" style="flex:1">Preview Bill</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="document.getElementById(\'travelExpenseBillForm\').style.display=\'none\'">Cancel</button>';
  html += '</div></div>';
  container.innerHTML = html;
}

function previewTravelExpenseBill() {
  var from = (document.getElementById('teBillFrom') || {}).value || '';
  var to = (document.getElementById('teBillTo') || {}).value || '';
  var vehicle = (document.getElementById('teBillVehicle') || {}).value || '';
  var amount = parseInt((document.getElementById('teBillAmount') || {}).value, 10) || 0;
  var km = (document.getElementById('teBillKm') || {}).value || '';
  var days = (document.getElementById('teBillDays') || {}).value || '1';
  var desc = (document.getElementById('teBillDesc') || {}).value || '';
  var travelDate = (document.getElementById('teBillDate') || {}).value || new Date().toISOString().split('T')[0];
  var billInput = document.getElementById('teBillInput');

  if (!from || !to) { showToast('Please enter From and To locations'); return; }
  if (!vehicle) { showToast('Please select mode of travel'); return; }
  if (!amount) { showToast('Please enter the bill amount'); return; }

  // Store form data + file before preview replaces the HTML
  var billFile = (billInput && billInput.files && billInput.files[0]) ? billInput.files[0] : null;
  window._travelExpPreview = { from: from, to: to, vehicle: vehicle, amount: amount, km: km, days: days, desc: desc, travelDate: travelDate, billFile: billFile };

  var billPreviewSrc = '';
  var billFileName = '';
  var previewImg = document.querySelector('#teBillPreview img');
  if (previewImg && previewImg.src) billPreviewSrc = previewImg.src;
  if (billFile) billFileName = billFile.name;

  var container = document.getElementById('travelExpenseBillForm');
  if (!container) return;
  var dateLabel = new Date(travelDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  var html = '<div class="card fade-in" style="padding:14px;margin-top:10px">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><div style="width:36px;height:36px;border-radius:10px;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:1.2rem">\uD83D\uDE97</div>';
  html += '<div><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin:0">Preview Travel Expense</h3>';
  html += '<p style="font-size:.7rem;color:var(--gray-400);margin:0">Review before submitting</p></div></div>';

  html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:12px;margin-bottom:12px">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.78rem">';
  html += '<div><span style="color:var(--gray-500)">From:</span><br><strong>' + escapeHTML(from) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">To:</span><br><strong>' + escapeHTML(to) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Travel Date:</span><br><strong>' + escapeHTML(dateLabel) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Days:</span><br><strong>' + escapeHTML(days) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Mode:</span><br><strong>' + escapeHTML(vehicle) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Distance:</span><br><strong>' + (km ? escapeHTML(km) + ' km' : 'N/A') + '</strong></div>';
  html += '<div style="grid-column:1/-1"><span style="color:var(--gray-500)">Bill Amount:</span><br><strong style="color:var(--danger);font-size:.92rem">Rs.' + amount.toLocaleString('en-IN') + '</strong></div>';
  html += '</div></div>';

  if (desc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">TRIP DETAILS</div>';
    html += '<div style="font-size:.78rem;padding:8px;background:var(--gray-50);border-radius:var(--radius-xs)">' + escapeHTML(desc) + '</div></div>';
  }

  if (billPreviewSrc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">ATTACHED RECEIPT' + (billFileName ? ' \u2014 ' + escapeHTML(billFileName) : '') + '</div>';
    html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:8px;text-align:center"><img src="' + billPreviewSrc + '" style="max-width:100%;max-height:300px;border-radius:var(--radius-xs)"></div></div>';
  } else {
    html += '<div style="margin-bottom:12px;padding:8px 10px;background:#fee2e2;border-radius:var(--radius-xs);font-size:.75rem;color:#dc2626;font-weight:600">No receipt attached</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="submitTravelExpenseBill()" style="flex:1;font-weight:700">Confirm & Submit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="showTravelExpenseBillForm()" style="flex:1">Edit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="document.getElementById(\'travelExpenseBillForm\').style.display=\'none\'">Cancel</button>';
  html += '</div></div>';
  container.innerHTML = html;
}

async function submitTravelExpenseBill() {
  // Use stored preview data if available (preview replaces form inputs)
  var stored = window._travelExpPreview || {};
  var from = stored.from || (document.getElementById('teBillFrom') || {}).value || '';
  var to = stored.to || (document.getElementById('teBillTo') || {}).value || '';
  var vehicle = stored.vehicle || (document.getElementById('teBillVehicle') || {}).value || '';
  var amount = stored.amount || parseInt((document.getElementById('teBillAmount') || {}).value, 10) || 0;
  var km = stored.km ? parseInt(stored.km, 10) : (parseInt((document.getElementById('teBillKm') || {}).value, 10) || null);
  var days = stored.days ? parseInt(stored.days, 10) : (parseInt((document.getElementById('teBillDays') || {}).value, 10) || 1);
  var desc = stored.desc || (document.getElementById('teBillDesc') || {}).value || '';
  var travelDate = stored.travelDate || (document.getElementById('teBillDate') || {}).value || new Date().toISOString().split('T')[0];
  var billFile = stored.billFile || null;
  if (!billFile) { var billInput = document.getElementById('teBillInput'); if (billInput && billInput.files && billInput.files[0]) billFile = billInput.files[0]; }
  if (!from || !to) { showToast('Please enter From and To locations'); return; }
  if (!vehicle) { showToast('Please select mode of travel'); return; }
  if (!amount) { showToast('Please enter the bill amount'); return; }
  var teBtn = document.querySelector('#travelExpenseBillForm .nf-btn-primary');
  _submitStart(teBtn);
  try {
    var fd = new FormData();
    fd.append('category', 'Travel');
    fd.append('amount', amount);
    fd.append('description', desc);
    fd.append('date', travelDate);
    fd.append('expenseType', 'travel_expense');
    fd.append('travelFrom', from);
    fd.append('travelTo', to);
    fd.append('vehicle', vehicle);
    if (km) fd.append('travelKm', km);
    fd.append('travelDays', days);
    if (billFile) fd.append('bill', billFile);
    var apiRes = await apiUpload('/expenses', fd);
    expenseReimbursements.push({
      id: (apiRes && apiRes.id) || (expenseReimbursements.length + 1),
      empCode: currentUser.code, empName: currentUser.name,
      category: 'Travel', amount: amount, description: desc, date: travelDate,
      status: 'Pending', expenseType: 'travel_expense',
      travelFrom: from, travelTo: to, vehicle: vehicle, travelKm: km, travelDays: days,
      billUrl: apiRes.billUrl || ''
    });
    _submitSuccess(teBtn);
    window._travelExpPreview = null;
    showToast('Travel expense bill submitted for Rs.' + amount.toLocaleString('en-IN'));
    setTimeout(function() { renderTravelExpenseScreen(); }, 1200);
  } catch (e) {
    _submitError(teBtn, 'Failed');
    showToast(e.message || 'Error submitting bill');
  }
}

// =====================================================
// HR HUB — JAVASCRIPT ADDITIONS
// =====================================================

// =====================================================
// DATA: KPI
// =====================================================
const KPI_TARGETS = [
  {label:'Punctuality',max:100},
  {label:'Quality Output',max:100},
  {label:'Teamwork',max:100},
  {label:'Task Completion',max:100},
  {label:'Initiative',max:100}
];

const KPI_DATA = (function() {
  const seed = {};
  EMPLOYEES.forEach(function(e) {
    var score = 40 + Math.floor(Math.abs(Math.sin(e.code.charCodeAt(2) + e.code.charCodeAt(3) || 1) * 60));
    if (score > 100) score = 100;
    var targets = KPI_TARGETS.map(function(t) {
      var v = 30 + Math.floor(Math.abs(Math.sin(e.code.length + t.label.length) * 70));
      if (v > 100) v = 100;
      return {label: t.label, score: v, max: t.max};
    });
    seed[e.code] = {score: score, targets: targets, selfRating: null};
  });
  return seed;
})();

function getKpiScore(empCode) {
  return KPI_DATA[empCode] ? KPI_DATA[empCode].score : 50;
}

function getRAGStatus(score) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function getRAGLabel(score) {
  if (score >= 75) return 'Green';
  if (score >= 50) return 'Amber';
  return 'Red';
}

function getRAGColor(score) {
  if (score >= 75) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

function submitSelfRating(empCode) {
  var inputs = document.querySelectorAll('#kpiSelfRatingForm input[type=range]');
  if (!inputs || inputs.length === 0) { showToast('No rating inputs found'); return; }
  if (!KPI_DATA[empCode]) { showToast('KPI data not found'); return; }
  var total = 0;
  var ratings = [];
  var categories = ['Punctuality','Quality Output','Teamwork','Task Completion','Initiative'];
  inputs.forEach(function(inp, idx) {
    var val = parseInt(inp.value, 10);
    total += val;
    ratings.push({ category: categories[idx] || 'General', rating: val / 20, comments: '' });
  });
  var avg = Math.round(total / inputs.length);
  KPI_DATA[empCode].selfRating = avg;
  apiCall('POST', '/kpi/self-rate', { period: new Date().getFullYear() + '-Q' + Math.ceil((new Date().getMonth() + 1) / 3), ratings: ratings }).catch(function(){});
  showToast('Self-rating submitted: ' + avg + '/100');
  renderKpiOverlay();
}

function renderKpiOverlay() {
  var el = document.getElementById('hrKpiContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';

  if (isMDorHR) {
    var depts = ['All'].concat(departments);
    var activeDept = el.dataset.dept || 'All';
    var chips = depts.map(function(d) {
      return '<button class="loc-filter-chip' + (activeDept === d ? ' active' : '') + '" onclick="kpiFilterDept(\'' + d + '\')">' + d + '</button>';
    }).join('');

    var filtered = activeDept === 'All' ? EMPLOYEES : EMPLOYEES.filter(function(e) { return e.dept === activeDept; });
    filtered = filtered.slice().sort(function(a, b) { return getKpiScore(b.code) - getKpiScore(a.code); });

    var rows = filtered.map(function(e) {
      var score = getKpiScore(e.code);
      var rag = getRAGStatus(score);
      var initials = e.name.split(' ').map(function(w) { return w[0]; }).join('').substring(0,2).toUpperCase();
      return '<div class="kpi-emp-row">' +
        '<div class="kpi-emp-score rag-' + rag + '">' + score + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + e.name + '</div>' +
          '<div style="font-size:.65rem;color:var(--gray-400)">' + e.dept + ' &middot; ' + e.designation + '</div>' +
        '</div>' +
        '<span class="badge-status badge-' + (rag === 'green' ? 'approved' : rag === 'amber' ? 'pending' : 'rejected') + '">' + getRAGLabel(score) + '</span>' +
      '</div>';
    }).join('');

    var green = filtered.filter(function(e) { return getKpiScore(e.code) >= 75; }).length;
    var amber = filtered.filter(function(e) { var s = getKpiScore(e.code); return s >= 50 && s < 75; }).length;
    var red = filtered.filter(function(e) { return getKpiScore(e.code) < 50; }).length;

    el.dataset.dept = activeDept;
    el.innerHTML = '<div class="summary-grid fade-in" style="margin-bottom:10px">' +
      '<div class="summary-card approved"><div class="amount">' + green + '</div><div class="label">Green</div></div>' +
      '<div class="summary-card pending"><div class="amount">' + amber + '</div><div class="label">Amber</div></div>' +
      '<div class="summary-card"><div class="amount" style="color:var(--danger)">' + red + '</div><div class="label">Red</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;margin-bottom:12px">' + chips + '</div>' +
    '<div class="section-title">Employee KPI Scores</div>' +
    rows;
  } else {
    var emp = currentUser;
    var kpi = KPI_DATA[emp.code] || {score:55, targets:[], selfRating:null};
    var score = kpi.score;
    var rag = getRAGStatus(score);
    var ragColor = getRAGColor(score);

    var targetBars = kpi.targets.map(function(t) {
      return '<div class="kpi-target-item">' +
        '<div class="kpi-target-label"><span>' + t.label + '</span><span>' + t.score + '/' + t.max + '</span></div>' +
        '<div class="kpi-target-bar"><div class="kpi-target-bar-fill" style="width:' + t.score + '%;background:' + getRAGColor(t.score) + '"></div></div>' +
      '</div>';
    }).join('');

    var selfRatingSection = '';
    if (kpi.selfRating !== null) {
      selfRatingSection = '<div class="card fade-in" style="margin-bottom:12px;padding:14px;background:var(--success-light);border:1px solid var(--success)">' +
        '<div style="font-size:.8rem;font-weight:600;color:var(--success-dark)">Self-Rating Submitted: ' + kpi.selfRating + '/100</div>' +
        '<div style="font-size:.68rem;color:var(--success-dark);opacity:.8;margin-top:2px">Submitted this quarter. Manager will review soon.</div>' +
      '</div>';
    } else {
      var sliders = KPI_TARGETS.map(function(t, i) {
        return '<div class="skill-slider-row">' +
          '<label>' + t.label + '</label>' +
          '<input type="range" min="0" max="100" value="70" oninput="this.nextElementSibling.textContent=this.value">' +
          '<span class="skill-val">70</span>' +
        '</div>';
      }).join('');
      selfRatingSection = '<div class="section-title">Self-Rating (This Quarter)</div>' +
        '<div class="card fade-in" style="padding:14px;margin-bottom:12px" id="kpiSelfRatingForm">' +
          sliders +
          '<button class="btn btn-primary w-full" style="margin-top:10px;border-radius:var(--radius-sm)" onclick="submitSelfRating(\'' + emp.code + '\')">Submit Self-Rating</button>' +
        '</div>';
    }

    el.innerHTML = '<div style="text-align:center;margin-bottom:16px">' +
      '<div class="kpi-score-circle rag-' + rag + '" style="border-color:' + ragColor + '">' +
        '<div class="score-val" style="color:' + ragColor + '">' + score + '</div>' +
        '<div class="score-lbl" style="color:' + ragColor + '">/100</div>' +
      '</div>' +
      '<div style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--gray-800)">' + emp.name + '</div>' +
      '<div style="font-size:.72rem;color:var(--gray-400);margin-top:2px">' + emp.dept + ' &middot; ' + emp.designation + '</div>' +
      '<span class="badge-status badge-' + (rag === 'green' ? 'approved' : rag === 'amber' ? 'pending' : 'rejected') + '" style="margin-top:8px;display:inline-flex">' + getRAGLabel(score) + ' Status</span>' +
    '</div>' +
    '<div class="section-title">Performance Breakdown</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' + targetBars + '</div>' +
    selfRatingSection;
  }
}

function kpiFilterDept(dept) {
  var el = document.getElementById('hrKpiContent');
  if (el) { el.dataset.dept = dept; renderKpiOverlay(); }
}

// =====================================================
// DATA: RECRUITMENT
// =====================================================
var JOB_POSTINGS = [];

var CANDIDATES = [];

var jobNextId = 1;
var candidateNextId = 1;
var PIPELINE_STAGES = ['Applied','Screening','Interview','Offer','Hired','Rejected'];

var RESUME_BANK = [];
var resumeNextId = 1;

function renderRecruitmentOverlay() {
  var el = document.getElementById('hrRecruitContent');
  if (!el) return;
  var activeTab = el.dataset.rtab || 'postings';
  var isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');

  var tabLabels = {postings:'Open Positions', pipeline:'Candidate Pipeline', resumes:'Resume Bank'};
  var pills = ['postings','pipeline','resumes'].map(function(t) {
    return '<button class="tab-pill' + (activeTab === t ? ' active' : '') + '" onclick="recruitTab(\'' + t + '\')">' + tabLabels[t] + '</button>';
  }).join('');

  var content = '';
  if (activeTab === 'postings') {
    if (isMdHr) {
      content += '<div style="margin-bottom:10px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openJobPostingForm()">+ New Opening</button></div>';
    }
    content += '<div id="jobPostingFormArea"></div>';
    content += JOB_POSTINGS.map(function(j) {
      var candCount = CANDIDATES.filter(function(c) { return c.jobId === j.id; }).length;
      var actionsHtml = '';
      if (isMdHr) {
        actionsHtml += '<button style="background:none;border:none;cursor:pointer;padding:2px 4px" onclick="event.stopPropagation();openJobPostingForm(' + j.id + ')" title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
        if (j.status === 'open') {
          actionsHtml += '<button style="background:none;border:none;cursor:pointer;padding:2px 4px" onclick="event.stopPropagation();closeJobPosting(' + j.id + ')" title="Close opening"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></button>';
        } else {
          actionsHtml += '<button style="background:none;border:none;cursor:pointer;padding:2px 4px" onclick="event.stopPropagation();reopenJobPosting(' + j.id + ')" title="Reopen"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>';
        }
        actionsHtml += '<button style="background:none;border:none;cursor:pointer;padding:2px 4px" onclick="event.stopPropagation();deleteJobPosting(' + j.id + ')" title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
      }
      return '<div class="job-card fade-in">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between"><h4>' + escapeHTML(j.title) + '</h4><div style="display:flex;gap:2px;align-items:center">' + actionsHtml + '</div></div>' +
        '<div class="job-meta">' +
          '<span>' + escapeHTML(j.dept) + '</span>' +
          '<span>' + j.openings + ' opening' + (j.openings > 1 ? 's' : '') + '</span>' +
          '<span>' + candCount + ' candidates</span>' +
          '<span>Posted ' + formatAdvDate(j.posted) + '</span>' +
        '</div>' +
        '<div style="font-size:.72rem;color:var(--gray-500);margin-bottom:10px;line-height:1.5">' + escapeHTML(j.jd || '') + '</div>' +
        '<div class="job-actions">' +
          '<span class="badge-status badge-' + (j.status === 'open' ? 'open' : 'pending') + '">' + j.status.charAt(0).toUpperCase() + j.status.slice(1) + '</span>' +
          (candCount > 0 ? '<button class="ai-screen-btn" style="margin-left:8px" onclick="aiScreenAllCandidates(' + j.id + ',this)">&#10024; Screen All</button>' : '') +
          (isMdHr ? '<button class="btn btn-sm btn-outline" style="margin-left:4px" onclick="event.stopPropagation();openCandidateForm(' + j.id + ')">+ Candidate</button>' : '') +
          (j.status === 'open' ? '<button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="showToast(\'Sharing job link...\')">Share</button>' : '') +
        '</div>' +
        '<div id="candidateFormArea_' + j.id + '"></div>' +
      '</div>';
    }).join('');
  } else if (activeTab === 'pipeline') {
    var stageDivs = PIPELINE_STAGES.map(function(stage) {
      var cands = CANDIDATES.filter(function(c) { return c.stage === stage; });
      var cards = cands.map(function(c) {
        var init = c.name.split(' ').map(function(w) { return w[0]; }).join('').substring(0,2).toUpperCase();
        var stars = '';
        for (var i = 1; i <= 5; i++) { stars += i <= c.rating ? '&#9733;' : '&#9734;'; }
        var aiHtml = '';
        if (c.aiScore !== undefined && c.aiScore !== null) {
          var scoreClass = c.aiScore >= 80 ? 'ai-score-green' : c.aiScore >= 50 ? 'ai-score-yellow' : 'ai-score-red';
          aiHtml = '<span class="ai-score-badge ' + scoreClass + '">' + c.aiScore + '</span>';
        } else {
          aiHtml = '<button class="ai-screen-btn" onclick="event.stopPropagation();aiScreenCandidate(' + c.id + ',this)">&#10024; AI</button>';
        }
        var summaryHtml = '';
        if (c.aiSummary) {
          var ai; try { ai = typeof c.aiSummary === 'string' ? JSON.parse(c.aiSummary) : c.aiSummary; } catch { ai = null; }
          var strengths = (ai.strengths || []).map(function(s) { return '<span class="ai-tag ai-tag-strength">' + s + '</span>'; }).join('');
          var concerns = (ai.concerns || []).map(function(s) { return '<span class="ai-tag ai-tag-concern">' + s + '</span>'; }).join('');
          summaryHtml = '<div class="ai-summary-card">' + (ai.summary || '') +
            (strengths ? '<div style="margin-top:3px">' + strengths + '</div>' : '') +
            (concerns ? '<div style="margin-top:2px">' + concerns + '</div>' : '') +
            '<div class="ai-recommendation">' + (ai.recommendation || '') + '</div></div>';
        }
        return '<div class="pipeline-candidate" style="flex-wrap:wrap" onclick="moveCandidateStagePrompt(' + c.id + ')">' +
          '<div class="cand-avatar">' + init + '</div>' +
          '<div class="cand-info"><div class="cand-name">' + c.name + '</div><div class="cand-role">' + c.role + ' &middot; ' + c.exp + '</div></div>' +
          '<span style="font-size:.65rem;color:var(--warning)">' + stars + '</span> ' + aiHtml +
          (summaryHtml ? '<div style="width:100%">' + summaryHtml + '</div>' : '') +
        '</div>';
      }).join('') || '<div style="font-size:.65rem;color:var(--gray-400);padding:4px 2px">No candidates</div>';
      return '<div class="pipeline-stage">' +
        '<h5>' + stage + '</h5>' +
        '<div class="stage-count">' + cands.length + '</div>' +
        cards +
      '</div>';
    }).join('');
    content = '<div class="pipeline-stages">' + stageDivs + '</div>';
  } else if (activeTab === 'resumes') {
    content = renderResumeBank(isMdHr);
  }

  el.dataset.rtab = activeTab;
  el.innerHTML = '<div class="tab-pills" style="margin-bottom:14px">' + pills + '</div>' + content;

  // Attach drag-drop events if resume tab is active (clone nodes to prevent duplicates)
  if (activeTab === 'resumes') {
    var dropZone = document.getElementById('resumeDropZone');
    var fileInput = document.getElementById('resumeFileInput');
    if (dropZone) {
      var newDZ = dropZone.cloneNode(true);
      dropZone.parentNode.replaceChild(newDZ, dropZone);
      dropZone = newDZ;
      fileInput = document.getElementById('resumeFileInput');
      dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('dragover'); });
      dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('dragover'); });
      dropZone.addEventListener('drop', function(e) { e.preventDefault(); dropZone.classList.remove('dragover'); handleResumeUpload(e.dataTransfer.files); });
      dropZone.addEventListener('click', function() { if (fileInput) fileInput.click(); });
    }
    if (fileInput) {
      var newFI = fileInput.cloneNode(true);
      fileInput.parentNode.replaceChild(newFI, fileInput);
      newFI.addEventListener('change', function() { handleResumeUpload(newFI.files); });
    }
  }
}

function recruitTab(tab) {
  var el = document.getElementById('hrRecruitContent');
  if (el) { el.dataset.rtab = tab; renderRecruitmentOverlay(); }
}

function moveCandidateStagePrompt(candidateId) {
  var cand = CANDIDATES.find(function(c) { return c.id === candidateId; });
  if (!cand) return;
  var nextIdx = PIPELINE_STAGES.indexOf(cand.stage) + 1;
  if (nextIdx >= PIPELINE_STAGES.length) { showToast(cand.name + ' is at final stage'); return; }
  var nextStage = PIPELINE_STAGES[nextIdx];
  cand.stage = nextStage;
  showToast(cand.name + ' moved to ' + nextStage);
  renderRecruitmentOverlay();
}

function openJobPostingForm(editId) {
  var existing = editId ? JOB_POSTINGS.find(function(j){return j.id===editId;}) : null;
  var area = document.getElementById('jobPostingFormArea');
  if (!area) return;
  var deptOpts = ['Design','Marketing','Execution','Production','QS','Admin','Accounts'].map(function(d) {
    return '<option value="' + d + '"' + (existing && existing.dept===d ? ' selected' : '') + '>' + d + '</option>';
  }).join('');

  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:10px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">' + (existing ? 'Edit Opening' : 'New Job Opening') + '</div>' +
    '<div class="form-group"><label class="form-label">Job Title *</label><input class="form-control" id="jobTitle" value="' + (existing ? escapeHTML(existing.title) : '') + '"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Department *</label><select class="form-control" id="jobDept">' + deptOpts + '</select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Openings *</label><input class="form-control" type="number" min="1" id="jobOpenings" value="' + (existing ? existing.openings : '1') + '"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Job Description</label><textarea class="form-control" id="jobJD" rows="3" style="resize:vertical">' + (existing ? escapeHTML(existing.jd || '') : '') + '</textarea></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveJobPosting(' + (editId || 0) + ')">' + (existing ? 'Update' : 'Create') + '</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="renderRecruitmentOverlay()">Cancel</button>' +
    '</div></div>';
}

async function saveJobPosting(editId) {
  var title = document.getElementById('jobTitle').value.trim();
  var dept = document.getElementById('jobDept').value;
  var openings = parseInt(document.getElementById('jobOpenings').value, 10) || 1;
  var jd = document.getElementById('jobJD').value.trim();
  if (!title) { showToast('Job title is required'); return; }
  try {
    if (editId) {
      await apiCall('PUT', '/recruitment/jobs/' + editId, {title:title,dept:dept,openings:openings,jd:jd});
      var job = JOB_POSTINGS.find(function(j){return j.id===editId;});
      if (job) { job.title = title; job.dept = dept; job.openings = openings; job.jd = jd; }
      showToast('Opening updated');
    } else {
      var res = await apiCall('POST', '/recruitment/jobs', {title:title,dept:dept,openings:openings,jd:jd});
      JOB_POSTINGS.push({id: res && res.id ? res.id : jobNextId, title:title, dept:dept, openings:openings, posted:new Date().toISOString().split('T')[0], status:'open', jd:jd});
      jobNextId++;
      showToast('Opening created');
    }
    renderRecruitmentOverlay();
  } catch (e) { showToast(e.message || 'Error saving job posting'); }
}

async function closeJobPosting(id) {
  var job = JOB_POSTINGS.find(function(j){return j.id===id;});
  if (!job) return;
  if (!confirm('Close "' + job.title + '"? This will mark it as closed.')) return;
  try {
    await apiCall('PATCH', '/recruitment/jobs/' + id + '/close');
    job.status = 'closed';
    showToast('Opening closed');
    renderRecruitmentOverlay();
  } catch (e) { showToast(e.message || 'Error closing job posting'); }
}

async function reopenJobPosting(id) {
  var job = JOB_POSTINGS.find(function(j){return j.id===id;});
  if (!job) return;
  try {
    await apiCall('PATCH', '/recruitment/jobs/' + id + '/reopen');
    job.status = 'open';
    showToast('Opening reopened');
    renderRecruitmentOverlay();
  } catch (e) { showToast(e.message || 'Error reopening job posting'); }
}

async function deleteJobPosting(id) {
  if (isTemporaryMD()) { showToast('Temporary MD does not have delete permissions'); return; }
  var job = JOB_POSTINGS.find(function(j){return j.id===id;});
  if (!job) return;
  var candCount = CANDIDATES.filter(function(c){return c.jobId===id;}).length;
  if (!confirm('Delete "' + job.title + '"?' + (candCount > 0 ? ' This will also remove ' + candCount + ' candidate(s).' : ''))) return;
  try {
    await apiCall('DELETE', '/recruitment/jobs/' + id);
    for (var i = JOB_POSTINGS.length - 1; i >= 0; i--) { if (JOB_POSTINGS[i].id === id) JOB_POSTINGS.splice(i, 1); }
    for (var i = CANDIDATES.length - 1; i >= 0; i--) { if (CANDIDATES[i].jobId === id) CANDIDATES.splice(i, 1); }
    showToast('Opening deleted');
    renderRecruitmentOverlay();
  } catch (e) { showToast(e.message || 'Error deleting job posting'); }
}

function openCandidateForm(jobId) {
  var area = document.getElementById('candidateFormArea_' + jobId);
  if (!area) return;
  var job = JOB_POSTINGS.find(function(j){return j.id===jobId;});
  if (!job) return;

  area.innerHTML = '<div style="padding:10px 0;border-top:1px solid var(--gray-100);margin-top:10px">' +
    '<div style="font-weight:600;font-size:.78rem;margin-bottom:8px">Add Candidate</div>' +
    '<div class="form-group"><label class="form-label">Name *</label><input class="form-control" id="candName_' + jobId + '"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Phone</label><input class="form-control" id="candPhone_' + jobId + '"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Experience</label><input class="form-control" id="candExp_' + jobId + '" placeholder="e.g. 3 yrs"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Rating (1-5)</label><input class="form-control" type="number" min="1" max="5" id="candRating_' + jobId + '" value="3"></div>' +
    '<div style="display:flex;gap:8px;margin-top:6px">' +
    '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="saveCandidate(' + jobId + ')">Add</button>' +
    '<button class="nf-btn nf-btn-secondary nf-btn-sm" onclick="document.getElementById(\'candidateFormArea_' + jobId + '\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function saveCandidate(jobId) {
  var name = document.getElementById('candName_' + jobId).value.trim();
  if (!name) { showToast('Candidate name is required'); return; }
  var job = JOB_POSTINGS.find(function(j){return j.id===jobId;});
  if (!job) return;
  try {
    var candData = {
      name: name, role: job.title, jobId: jobId, stage: 'Applied',
      rating: parseInt(document.getElementById('candRating_' + jobId).value, 10) || 3,
      phone: document.getElementById('candPhone_' + jobId).value.trim(),
      exp: document.getElementById('candExp_' + jobId).value.trim()
    };
    var res = await apiCall('POST', '/recruitment/candidates', candData);
    candData.id = res && res.id ? res.id : candidateNextId;
    CANDIDATES.push(candData);
    candidateNextId++;
    showToast('Candidate added');
    renderRecruitmentOverlay();
  } catch (e) { showToast(e.message || 'Error adding candidate'); }
}

// --- AI Resume Screening ---
async function aiScreenCandidate(candidateId, btn) {
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '&#8987; Screening...'; }
  try {
    var result = await apiCall('POST', '/recruitment/candidates/' + candidateId + '/ai-screen');
    if (!result || result.error) {
      showToast(result ? result.error : 'AI screening failed — check API key');
      if (btn) { btn.classList.remove('loading'); btn.innerHTML = '&#10024; AI'; }
      return;
    }
    // Update local CANDIDATES array
    var cand = CANDIDATES.find(function(c) { return c.id === candidateId; });
    if (cand) {
      cand.aiScore = result.score;
      cand.aiSummary = JSON.stringify(result);
    }
    showToast('AI Score: ' + result.score + '/100 — ' + result.recommendation);
    renderRecruitmentOverlay();
  } catch (e) {
    showToast('AI screening error');
    if (btn) { btn.classList.remove('loading'); btn.innerHTML = '&#10024; AI'; }
  }
}

async function aiScreenAllCandidates(jobId, btn) {
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '&#8987; Screening...'; }
  try {
    var result = await apiCall('POST', '/recruitment/jobs/' + jobId + '/ai-screen-all');
    if (!result || result.error) {
      showToast(result ? result.error : 'Batch screening failed');
      if (btn) { btn.classList.remove('loading'); btn.innerHTML = '&#10024; Screen All'; }
      return;
    }
    // Update local data
    (result.results || []).forEach(function(r) {
      var cand = CANDIDATES.find(function(c) { return c.id === r.candidateId; });
      if (cand && r.score !== undefined) {
        cand.aiScore = r.score;
        cand.aiSummary = JSON.stringify(r);
      }
    });
    showToast('Screened ' + result.screened + ' candidates');
    renderRecruitmentOverlay();
  } catch (e) {
    showToast('Batch screening error');
    if (btn) { btn.classList.remove('loading'); btn.innerHTML = '&#10024; Screen All'; }
  }
}

// =====================================================
// RESUME BANK
// =====================================================
function renderResumeBank(isMdHr) {
  var searchVal = '';
  var deptVal = '';
  var searchEl = document.getElementById('resumeSearch');
  var deptEl = document.getElementById('resumeDeptFilter');
  if (searchEl) searchVal = searchEl.value.toLowerCase();
  if (deptEl) deptVal = deptEl.value;

  var filtered = RESUME_BANK.filter(function(r) {
    var matchSearch = !searchVal || r.name.toLowerCase().indexOf(searchVal) !== -1 ||
      r.role.toLowerCase().indexOf(searchVal) !== -1 ||
      r.skills.some(function(s) { return s.toLowerCase().indexOf(searchVal) !== -1; });
    var matchDept = !deptVal || r.role.toLowerCase().indexOf(deptVal.toLowerCase()) !== -1;
    return matchSearch && matchDept;
  });

  var uploadZone = '<div class="resume-upload-zone" id="resumeDropZone">' +
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" stroke-width="1.5" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
    '<div style="font-size:.82rem;font-weight:600;color:var(--gray-600)">Drop resumes here or tap to upload</div>' +
    '<div style="font-size:.68rem;color:var(--gray-400);margin-top:4px">PDF, DOC, DOCX, TXT accepted</div>' +
    '<input type="file" id="resumeFileInput" accept=".pdf,.doc,.docx,.txt" multiple style="display:none">' +
  '</div>';

  var deptOpts = ['','Welder','Site Engineer','Accounts Executive','Fabricator','Helper','Supervisor','Driver','Office Staff'].map(function(d) {
    return '<option value="' + d + '"' + (deptVal === d ? ' selected' : '') + '>' + (d || 'All Roles') + '</option>';
  }).join('');

  var filterBar = '<div class="resume-filter-bar">' +
    '<input type="text" id="resumeSearch" placeholder="Search name, role, skills..." value="' + escapeHTML(searchVal) + '" oninput="filterResumeBank()">' +
    '<select id="resumeDeptFilter" onchange="filterResumeBank()">' + deptOpts + '</select>' +
    (isMdHr ? '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="aiFilterAllResumes(this)">&#10024; AI Filter All</button>' : '') +
  '</div>';

  var cards = filtered.length > 0 ? filtered.map(function(r) {
    var skillTags = r.skills.map(function(s) { return '<span class="resume-skills-tag">' + escapeHTML(s) + '</span>'; }).join('');
    var scoreHtml = '';
    if (r.aiScore !== undefined && r.aiScore !== null) {
      var scoreClass = r.aiScore >= 80 ? 'ai-score-green' : r.aiScore >= 50 ? 'ai-score-yellow' : 'ai-score-red';
      scoreHtml = '<span class="ai-score-badge ' + scoreClass + '" style="margin-left:8px">' + r.aiScore + '</span>';
    }
    var summaryHtml = '';
    if (r.aiSummary) {
      summaryHtml = '<div style="font-size:.68rem;color:var(--gray-500);margin-top:6px;padding:6px 8px;background:var(--gray-50);border-radius:var(--radius-xs);line-height:1.4">' + escapeHTML(r.aiSummary) + '</div>';
    }
    return '<div class="resume-card fade-in">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:.85rem;font-weight:600">' + escapeHTML(r.name) + scoreHtml + '</div>' +
          '<div style="font-size:.72rem;color:var(--gray-500);margin-top:2px">' + escapeHTML(r.role) + ' &middot; ' + escapeHTML(r.exp) + '</div>' +
        '</div>' +
        '<div style="font-size:.6rem;color:var(--gray-400)">' + formatAdvDate(r.uploadDate) + '</div>' +
      '</div>' +
      '<div style="margin-top:6px">' + skillTags + '</div>' +
      (r.phone ? '<div style="font-size:.68rem;color:var(--gray-400);margin-top:4px">' + escapeHTML(r.phone) + (r.email ? ' &middot; ' + escapeHTML(r.email) : '') + '</div>' : '') +
      summaryHtml +
      '<div style="display:flex;gap:6px;margin-top:8px">' +
        (isMdHr && r.aiScore === undefined ? '<button class="ai-screen-btn" onclick="aiScreenResume(' + r.id + ',this)">&#10024; AI Screen</button>' : '') +
        (isMdHr ? '<button class="btn btn-sm btn-outline" onclick="addResumeToPipeline(' + r.id + ')">+ Pipeline</button>' : '') +
      '</div>' +
    '</div>';
  }).join('') : '<div class="nf-empty">No resumes found</div>';

  return uploadZone + filterBar + '<div id="resumeCardsContainer">' + cards + '</div>';
}

function handleResumeUpload(files) {
  if (!files || files.length === 0) return;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var ext = file.name.split('.').pop().toLowerCase();
    if (['pdf','doc','docx','txt'].indexOf(ext) === -1) {
      showToast('Invalid file type: ' + file.name);
      continue;
    }
    var baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    RESUME_BANK.push({
      id: resumeNextId,
      name: baseName,
      phone: '',
      email: '',
      role: 'Not specified',
      skills: [],
      exp: 'N/A',
      resumeText: 'Uploaded file: ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)',
      uploadDate: new Date().toISOString().split('T')[0],
      source: 'upload'
    });
    resumeNextId++;
  }
  saveLocalOnlyData();
  showToast(files.length + ' resume(s) uploaded');
  renderRecruitmentOverlay();
}

function filterResumeBank() {
  var isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  var container = document.getElementById('resumeCardsContainer');
  if (!container) return;
  var searchVal = (document.getElementById('resumeSearch') || {}).value || '';
  var deptVal = (document.getElementById('resumeDeptFilter') || {}).value || '';
  searchVal = searchVal.toLowerCase();

  var filtered = RESUME_BANK.filter(function(r) {
    var matchSearch = !searchVal || r.name.toLowerCase().indexOf(searchVal) !== -1 ||
      r.role.toLowerCase().indexOf(searchVal) !== -1 ||
      r.skills.some(function(s) { return s.toLowerCase().indexOf(searchVal) !== -1; });
    var matchDept = !deptVal || r.role.toLowerCase().indexOf(deptVal.toLowerCase()) !== -1;
    return matchSearch && matchDept;
  });

  var cards = filtered.length > 0 ? filtered.map(function(r) {
    var skillTags = r.skills.map(function(s) { return '<span class="resume-skills-tag">' + escapeHTML(s) + '</span>'; }).join('');
    var scoreHtml = '';
    if (r.aiScore !== undefined && r.aiScore !== null) {
      var scoreClass = r.aiScore >= 80 ? 'ai-score-green' : r.aiScore >= 50 ? 'ai-score-yellow' : 'ai-score-red';
      scoreHtml = '<span class="ai-score-badge ' + scoreClass + '" style="margin-left:8px">' + r.aiScore + '</span>';
    }
    var summaryHtml = '';
    if (r.aiSummary) {
      summaryHtml = '<div style="font-size:.68rem;color:var(--gray-500);margin-top:6px;padding:6px 8px;background:var(--gray-50);border-radius:var(--radius-xs);line-height:1.4">' + escapeHTML(r.aiSummary) + '</div>';
    }
    return '<div class="resume-card fade-in">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:.85rem;font-weight:600">' + escapeHTML(r.name) + scoreHtml + '</div>' +
          '<div style="font-size:.72rem;color:var(--gray-500);margin-top:2px">' + escapeHTML(r.role) + ' &middot; ' + escapeHTML(r.exp) + '</div>' +
        '</div>' +
        '<div style="font-size:.6rem;color:var(--gray-400)">' + formatAdvDate(r.uploadDate) + '</div>' +
      '</div>' +
      '<div style="margin-top:6px">' + skillTags + '</div>' +
      (r.phone ? '<div style="font-size:.68rem;color:var(--gray-400);margin-top:4px">' + escapeHTML(r.phone) + (r.email ? ' &middot; ' + escapeHTML(r.email) : '') + '</div>' : '') +
      summaryHtml +
      '<div style="display:flex;gap:6px;margin-top:8px">' +
        (isMdHr && r.aiScore === undefined ? '<button class="ai-screen-btn" onclick="aiScreenResume(' + r.id + ',this)">&#10024; AI Screen</button>' : '') +
        (isMdHr ? '<button class="btn btn-sm btn-outline" onclick="addResumeToPipeline(' + r.id + ')">+ Pipeline</button>' : '') +
      '</div>' +
    '</div>';
  }).join('') : '<div class="nf-empty">No resumes found</div>';

  container.innerHTML = cards;
}

async function aiScreenResume(resumeId, btn) {
  var resume = RESUME_BANK.find(function(r) { return r.id === resumeId; });
  if (!resume) return;
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '&#8987; Screening...'; }
  try {
    var result = await apiCall('POST', '/recruitment/candidates/' + resumeId + '/ai-screen', {resumeText: resume.resumeText, name: resume.name, role: resume.role});
    if (result && result.score !== undefined) {
      resume.aiScore = result.score;
      resume.aiSummary = result.summary || result.recommendation || 'AI Score: ' + result.score;
      showToast('AI Score for ' + resume.name + ': ' + result.score + '/100');
    } else {
      // Mock score locally when backend unavailable
      var mockScore = 40 + Math.floor(Math.abs(Math.sin(resumeId * 7.3)) * 55);
      resume.aiScore = mockScore;
      resume.aiSummary = 'Skills match: ' + resume.skills.join(', ') + '. Experience: ' + resume.exp + '. ' + (mockScore >= 70 ? 'Strong candidate for ' : 'Consider for ') + resume.role + ' role.';
      showToast('AI Score for ' + resume.name + ': ' + mockScore + '/100');
    }
    saveLocalOnlyData();
    renderRecruitmentOverlay();
  } catch (e) {
    // Mock score on error
    var mockScore = 40 + Math.floor(Math.abs(Math.sin(resumeId * 7.3)) * 55);
    resume.aiScore = mockScore;
    resume.aiSummary = 'Skills match: ' + resume.skills.join(', ') + '. Experience: ' + resume.exp + '. ' + (mockScore >= 70 ? 'Strong candidate for ' : 'Consider for ') + resume.role + ' role.';
    showToast('AI Score for ' + resume.name + ': ' + mockScore + '/100');
    saveLocalOnlyData();
    renderRecruitmentOverlay();
  }
}

async function aiFilterAllResumes(btn) {
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '&#8987; Screening...'; }
  var unscreened = RESUME_BANK.filter(function(r) { return r.aiScore === undefined; });
  if (unscreened.length === 0) { showToast('All resumes already screened'); if (btn) { btn.classList.remove('loading'); btn.innerHTML = '&#10024; AI Filter All'; } return; }
  var count = 0;
  for (var i = 0; i < unscreened.length; i++) {
    var r = unscreened[i];
    var mockScore = 40 + Math.floor(Math.abs(Math.sin(r.id * 7.3)) * 55);
    r.aiScore = mockScore;
    r.aiSummary = 'Skills match: ' + r.skills.join(', ') + '. Experience: ' + r.exp + '. ' + (mockScore >= 70 ? 'Strong candidate for ' : 'Consider for ') + r.role + ' role.';
    count++;
  }
  saveLocalOnlyData();
  showToast('Screened ' + count + ' resume(s)');
  renderRecruitmentOverlay();
}

function addResumeToPipeline(resumeId) {
  var resume = RESUME_BANK.find(function(r) { return r.id === resumeId; });
  if (!resume) return;
  var openJobs = JOB_POSTINGS.filter(function(j) { return j.status === 'open'; });
  if (openJobs.length === 0) { showToast('No open positions available'); return; }
  var options = openJobs.map(function(j) { return j.title + ' (' + j.dept + ')'; });
  var choice = prompt('Select job (enter number):\\n' + options.map(function(o, i) { return (i + 1) + '. ' + o; }).join('\\n'));
  if (!choice) return;
  var idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= openJobs.length) { showToast('Invalid selection'); return; }
  var job = openJobs[idx];
  CANDIDATES.push({
    id: candidateNextId,
    name: resume.name,
    role: job.title,
    jobId: job.id,
    stage: 'Applied',
    rating: resume.aiScore ? Math.min(5, Math.round(resume.aiScore / 20)) : 3,
    phone: resume.phone,
    exp: resume.exp,
    aiScore: resume.aiScore,
    aiSummary: resume.aiSummary ? JSON.stringify({summary: resume.aiSummary, score: resume.aiScore, strengths: resume.skills, concerns: [], recommendation: 'Added from Resume Bank'}) : undefined
  });
  candidateNextId++;
  saveLocalOnlyData();
  showToast(resume.name + ' added to ' + job.title + ' pipeline');
  recruitTab('pipeline');
}

// =====================================================
// DATA: DOCUMENTS
// =====================================================
var DOCUMENT_TEMPLATES = [
  {id:'offer', label:'Offer Letter', desc:'Official employment offer with CTC details', icon:'&#128196;'},
  {id:'nda', label:'NDA Agreement', desc:'Non-disclosure and confidentiality agreement', icon:'&#128274;'},
  {id:'appointment', label:'Appointment Letter', desc:'Formal appointment on company letterhead', icon:'&#128203;'},
  {id:'experience', label:'Experience Certificate', desc:'Experience & relieving certificate', icon:'&#127891;'}
];

var EMPLOYEE_DOCUMENTS = [];

function renderDocumentsOverlay() {
  var el = document.getElementById('hrDocumentsContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';

  var myDocs = EMPLOYEE_DOCUMENTS.filter(function(d) { return d.empCode === currentUser.code; });
  var vaultHtml = '';
  if (myDocs.length > 0) {
    vaultHtml = '<div class="section-title">My Document Vault</div>' +
      myDocs.map(function(d) {
        return '<div class="doc-upload-zone" style="cursor:default">' +
          '<div class="doc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>' +
          '<div class="doc-info"><h4>' + d.label + '</h4><p>Issued: ' + formatAdvDate(d.date) + '</p></div>' +
          '<div class="doc-status" style="color:var(--success);font-size:.65rem;font-weight:600">' + d.status + '</div>' +
        '</div>';
      }).join('');
  } else {
    vaultHtml = '<div class="section-title">My Document Vault</div><div style="text-align:center;padding:24px;color:var(--gray-400);font-size:.82rem">No documents found. Contact HR.</div>';
  }

  var genSection = '';
  if (isMDorHR) {
    var empOptions = EMPLOYEES.map(function(e) {
      return '<option value="' + e.code + '">' + e.name + ' (' + e.code + ')</option>';
    }).join('');
    var tplOptions = DOCUMENT_TEMPLATES.map(function(t) {
      return '<option value="' + t.id + '">' + t.label + '</option>';
    }).join('');
    genSection = '<div class="section-title" style="margin-top:16px">Generate Document</div>' +
      '<div class="card fade-in" style="padding:14px">' +
        '<div class="form-row"><label>Select Employee</label><select id="docGenEmp">' + empOptions + '</select></div>' +
        '<div class="form-row"><label>Document Type</label><select id="docGenType">' + tplOptions + '</select></div>' +
        '<button class="btn btn-primary w-full" style="border-radius:var(--radius-sm);margin-top:8px" onclick="generateDocument()">Generate &amp; Send</button>' +
      '</div>' +
      '<div class="section-title" style="margin-top:16px">All Document Records</div>' +
      EMPLOYEE_DOCUMENTS.map(function(d) {
        var emp = EMPLOYEES.find(function(e) { return e.code === d.empCode; });
        return '<div class="doc-upload-zone" style="cursor:default">' +
          '<div class="doc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>' +
          '<div class="doc-info"><h4>' + d.label + '</h4><p>' + (emp ? emp.name : d.empCode) + ' &middot; ' + formatAdvDate(d.date) + '</p></div>' +
          '<div class="doc-status" style="color:var(--success);font-size:.65rem;font-weight:600">' + d.status + '</div>' +
        '</div>';
      }).join('');
  }

  el.innerHTML = vaultHtml + genSection;
}

function generateDocument() {
  var empCode = document.getElementById('docGenEmp').value;
  var tplId = document.getElementById('docGenType').value;
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  var tpl = DOCUMENT_TEMPLATES.find(function(t) { return t.id === tplId; });
  if (!emp || !tpl) return;
  var today = new Date().toISOString().split('T')[0];
  EMPLOYEE_DOCUMENTS.push({empCode: empCode, type: tplId, label: tpl.label, date: today, status: 'Generated'});
  showToast(tpl.label + ' generated for ' + emp.name);
  renderDocumentsOverlay();
}

// =====================================================
// DATA: CAREER PATHS
// =====================================================



// =====================================================
// DATA: TASKS
// =====================================================
var TASK_DATA = [];

var TASK_PHILOSOPHY = 'Great work is not about doing more — it is about doing the right things at the right time with full commitment. Each task you complete brings the team one step closer to excellence.';

function renderTasksOverlay() {
  var el = document.getElementById('hrTasksContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';

  var philosophy = '<div class="task-philosophy">' +
    '<p>"' + TASK_PHILOSOPHY + '"</p>' +
    '<div class="attr">— Swetha Structures HR Philosophy</div>' +
  '</div>';

  var myTasks = TASK_DATA.filter(function(t) {
    if (t.assignedTo === 'ALL') return true;
    if (t.assignedTo === currentUser.dept) return true;
    if (t.assignedTo === currentUser.code) return true;
    return false;
  });

  var types = ['emergency','routine','one-time'];

  var taskHtml = '';
  types.forEach(function(type) {
    var filtered = myTasks.filter(function(t) { return t.type === type; });
    if (filtered.length === 0) return;
    var label = type === 'one-time' ? 'One-Time' : type.charAt(0).toUpperCase() + type.slice(1);
    taskHtml += '<div class="section-title">' + label + ' Tasks</div>';
    filtered.forEach(function(t) {
      var checkIcon = t.done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/></svg>' : '';
      taskHtml += '<div class="task-item' + (t.done ? ' done' : '') + '" id="taskItem' + t.id + '">' +
        '<div class="task-checkbox' + (t.done ? ' checked' : '') + '" onclick="toggleTaskStatus(' + t.id + ')">' + checkIcon + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="task-title">' + t.title + '<span class="task-type-badge ' + type + '">' + label + '</span></div>' +
          '<div class="task-meta">Due: ' + formatAdvDate(t.dueDate) + (t.note ? ' &middot; ' + t.note : '') + '</div>' +
        '</div>' +
      '</div>';
    });
  });

  var assignForm = '';
  if (isMDorHR) {
    var empOptions = EMPLOYEES.map(function(e) {
      return '<option value="' + e.code + '">' + e.name + ' (' + e.code + ')</option>';
    }).join('');
    var deptOptions = ['ALL'].concat(departments).map(function(d) {
      return '<option value="' + d + '">' + d + '</option>';
    }).join('');

    var totalDone = TASK_DATA.filter(function(t) { return t.done; }).length;
    var totalPending = TASK_DATA.filter(function(t) { return !t.done; }).length;

    assignForm = '<div class="summary-grid fade-in" style="margin-bottom:12px">' +
      '<div class="summary-card"><div class="amount">' + TASK_DATA.length + '</div><div class="label">Total</div></div>' +
      '<div class="summary-card approved"><div class="amount">' + totalDone + '</div><div class="label">Done</div></div>' +
      '<div class="summary-card pending"><div class="amount">' + totalPending + '</div><div class="label">Pending</div></div>' +
    '</div>' +
    '<div class="section-title">Assign New Task</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
      '<div class="form-row"><label>Task Title</label><input type="text" id="newTaskTitle" placeholder="Enter task description"></div>' +
      '<div class="form-row"><label>Assign To (Employee or Dept)</label><select id="newTaskAssign"><optgroup label="Departments">' + deptOptions + '</optgroup><optgroup label="Employees">' + empOptions + '</optgroup></select></div>' +
      '<div class="form-row"><label>Type</label><select id="newTaskType"><option value="routine">Routine</option><option value="emergency">Emergency</option><option value="one-time">One-Time</option></select></div>' +
      '<div class="form-row"><label>Due Date</label><input type="date" id="newTaskDue"></div>' +
      '<button class="btn btn-primary w-full" style="border-radius:var(--radius-sm);margin-top:8px" onclick="assignTask()">Assign Task</button>' +
    '</div>';
  }

  el.innerHTML = philosophy + assignForm + taskHtml;
}

function toggleTaskStatus(taskId) {
  var task = TASK_DATA.find(function(t) { return t.id === taskId; });
  if (!task) return;
  task.done = !task.done;
  showToast(task.done ? 'Task marked complete!' : 'Task marked pending');
  apiCall('PATCH', '/tasks/' + taskId + '/toggle').catch(function(){});
  renderTasksOverlay();
}

function assignTask() {
  var title = document.getElementById('newTaskTitle').value.trim();
  var assignTo = document.getElementById('newTaskAssign').value;
  var type = document.getElementById('newTaskType').value;
  var dueDate = document.getElementById('newTaskDue').value;
  if (!title) { showToast('Please enter a task title'); return; }
  if (!dueDate) { showToast('Please select a due date'); return; }
  var newId = TASK_DATA.length > 0 ? Math.max.apply(null, TASK_DATA.map(function(t) { return t.id; })) + 1 : 1;
  TASK_DATA.push({id:newId, title:title, type:type, assignedTo:assignTo, dueDate:dueDate, priority:'normal', done:false, note:'Assigned by ' + currentUser.name});
  showToast('Task assigned successfully');
  renderTasksOverlay();
}




// =====================================================
// DATA: VISION
// =====================================================
var COMPANY_VISION = {
  vision: 'To be the most trusted and innovative steel building specialist in India, engineering structures that stand for generations.',
  mission: 'We build quality steel structures with integrity, delivering excellence to every client while nurturing our team\'s growth and well-being.',
  values: ['Integrity','Quality','Safety','Innovation','Teamwork','Excellence','Customer First','Growth Mindset']
};

var PERSONAL_VISIONS = {};

function renderVisionOverlay() {
  var el = document.getElementById('hrVisionContent');
  if (!el || !currentUser) return;

  var myVision = PERSONAL_VISIONS[currentUser.code] || {vision:'', goals:''};

  var companyCard = '<div class="section-title" style="margin-top:0">Company Vision &amp; Mission</div>' +
    '<div class="vision-card fade-in">' +
      '<h3>Our Vision</h3>' +
      '<p>' + COMPANY_VISION.vision + '</p>' +
      '<div class="vision-section"><h5>Mission</h5><p>' + COMPANY_VISION.mission + '</p></div>' +
      '<div class="vision-section"><h5>Core Values</h5><div class="values-row">' +
        COMPANY_VISION.values.map(function(v) { return '<span class="value-chip">' + v + '</span>'; }).join('') +
      '</div></div>' +
    '</div>';

  var personalSection = '<div class="section-title">My Personal Vision</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
      '<div class="form-row"><label>My Personal Vision (1-2 sentences)</label><textarea id="personalVisionText" rows="3" placeholder="What do you want to achieve in your career here?">' + (myVision.vision || '') + '</textarea></div>' +
      '<div class="form-row"><label>My 90-Day Goals</label><textarea id="personalGoalsText" rows="3" placeholder="List 2-3 specific goals for the next 90 days...">' + (myVision.goals || '') + '</textarea></div>' +
      '<button class="btn btn-primary w-full" style="border-radius:var(--radius-sm);margin-top:8px" onclick="savePersonalVision()">Save My Vision</button>' +
    '</div>';

  el.innerHTML = companyCard + personalSection;
}

function savePersonalVision() {
  if (!currentUser) return;
  var visionEl = document.getElementById('personalVisionText');
  var goalsEl = document.getElementById('personalGoalsText');
  if (!visionEl || !goalsEl) { showToast('Form not found'); return; }
  var vision = visionEl.value.trim();
  var goals = goalsEl.value.trim();
  if (!vision && !goals) { showToast('Please enter your vision or goals'); return; }
  PERSONAL_VISIONS[currentUser.code] = {vision: vision, goals: goals};
  saveLocalOnlyData();
  showToast('Personal vision saved!');
}


// =====================================================
// HR ANALYTICS
// =====================================================
function getHRMetrics() {
  var totalHeadcount = EMPLOYEES.length;
  var totalPayroll = EMPLOYEES.reduce(function(sum, e) { return sum + e.salary; }, 0);
  var avgSalary = Math.round(totalPayroll / totalHeadcount);
  var openPositions = JOB_POSTINGS.filter(function(j) { return j.status === 'open'; }).length;
  var openings = JOB_POSTINGS.filter(function(j) { return j.status === 'open'; }).reduce(function(s, j) { return s + j.openings; }, 0);
  var pendingApprovals = (typeof advanceRequests !== 'undefined') ? advanceRequests.filter(function(r) { return r.status === 'pending' || r.status === 'hr_accepted'; }).length : 0;
  var allScores = EMPLOYEES.map(function(e) { return getKpiScore(e.code); });
  var avgKpi = Math.round(allScores.reduce(function(a, b) { return a + b; }, 0) / allScores.length);
  var deptDist = {};
  departments.forEach(function(d) { deptDist[d] = EMPLOYEES.filter(function(e) { return e.dept === d; }).length; });
  var green = allScores.filter(function(s) { return s >= 75; }).length;
  var amber = allScores.filter(function(s) { return s >= 50 && s < 75; }).length;
  var red = allScores.filter(function(s) { return s < 50; }).length;
  return {totalHeadcount, totalPayroll, avgSalary, openPositions, openings, pendingApprovals, avgKpi, deptDist, green, amber, red};
}

// =====================================================
// CHART.JS ANALYTICS — instance tracking + theme
// =====================================================
var _chartInstances = {};
function destroyChart(id) { if (_chartInstances[id]) { _chartInstances[id].destroy(); delete _chartInstances[id]; } }
function getChartTheme() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#E5E7EB' : '#374151',
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  };
}

function renderAnalyticsOverlay() {
  var el = document.getElementById('hrAnalyticsContent');
  if (!el || !currentUser) return;
  var m = getHRMetrics();

  var funnelSteps = [
    {label:'Applied', count: CANDIDATES.length, color:'#DBEAFE'},
    {label:'Screening', count: CANDIDATES.filter(function(c) { return ['Screening','Interview','Offer','Hired'].indexOf(c.stage) !== -1; }).length, color:'#FFEDD5'},
    {label:'Interview', count: CANDIDATES.filter(function(c) { return ['Interview','Offer','Hired'].indexOf(c.stage) !== -1; }).length, color:'#FFF7ED'},
    {label:'Offered', count: CANDIDATES.filter(function(c) { return ['Offer','Hired'].indexOf(c.stage) !== -1; }).length, color:'#FEF3C7'},
    {label:'Hired', count: CANDIDATES.filter(function(c) { return c.stage === 'Hired'; }).length, color:'#D1FAE5'}
  ];

  var funnelHtml = funnelSteps.map(function(f) {
    return '<div class="funnel-step" style="background:' + f.color + '">' +
      '<span class="fs-label">' + f.label + '</span>' +
      '<span class="fs-count">' + f.count + '</span>' +
    '</div>';
  }).join('');

  // Attendance rate from DB logs
  var attendRate = (function() {
    if (!attendanceLogs || attendanceLogs.length === 0) return 0;
    var now = new Date(), curM = now.getMonth(), curY = now.getFullYear();
    var monthLogs = attendanceLogs.filter(function(l) { var d = new Date(l.date || l.check_in); return d.getMonth() === curM && d.getFullYear() === curY; });
    var uniqueEmps = {};
    monthLogs.forEach(function(l) { var c = l.empCode || l.emp_code; if (c) uniqueEmps[c] = (uniqueEmps[c] || 0) + 1; });
    var empCount = Object.keys(uniqueEmps).length;
    if (empCount === 0) return 0;
    var workingDays = 0;
    for (var d = 1; d <= now.getDate(); d++) { var dt = new Date(curY, curM, d); if (dt.getDay() !== 0) workingDays++; }
    if (workingDays === 0) return 0;
    var totalRate = 0;
    Object.keys(uniqueEmps).forEach(function(c) { totalRate += Math.min(uniqueEmps[c] / workingDays * 100, 100); });
    return Math.round(totalRate / empCount);
  })();

  el.innerHTML = '<div class="analytics-grid fade-in">' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--primary-50);color:var(--primary)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>' +
      '<div class="ac-value">' + m.totalHeadcount + '</div>' +
      '<div class="ac-label">Total Headcount</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--success-light);color:var(--success-dark)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>' +
      '<div class="ac-value">&#8377;' + (m.totalPayroll / 100000).toFixed(1) + 'L</div>' +
      '<div class="ac-label">Monthly Payroll</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--warning-light);color:var(--warning-dark)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>' +
      '<div class="ac-value">' + m.avgKpi + '</div>' +
      '<div class="ac-label">Avg KPI Score</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--primary-50);color:var(--primary)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></div>' +
      '<div class="ac-value">' + m.openings + '</div>' +
      '<div class="ac-label">Open Vacancies</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--danger-light);color:var(--danger)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>' +
      '<div class="ac-value">' + m.pendingApprovals + '</div>' +
      '<div class="ac-label">Pending Approvals</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:var(--teal-light);color:var(--teal-dark)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>' +
      '<div class="ac-value">&#8377;' + m.avgSalary.toLocaleString('en-IN') + '</div>' +
      '<div class="ac-label">Avg Salary</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:#DBEAFE;color:#2563EB"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>' +
      '<div class="ac-value">' + attendRate + '%</div>' +
      '<div class="ac-label">Attendance Rate</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:#FEE2E2;color:#DC2626"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>' +
      '<div class="ac-value">2.1%</div>' +
      '<div class="ac-label">Attrition Rate</div>' +
    '</div>' +
    '<div class="analytics-card">' +
      '<div class="ac-icon" style="background:#F3E8FF;color:#7C3AED"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>' +
      '<div class="ac-value">24 hrs</div>' +
      '<div class="ac-label">Training Hours</div>' +
    '</div>' +
  '</div>' +
  '<div class="section-title">Headcount by Department</div>' +
  '<div class="card fade-in" style="padding:14px;margin-bottom:12px"><canvas id="chartDeptDonut" height="220"></canvas></div>' +
  '<div class="section-title">Monthly Payroll Trend (FY 2025-26)</div>' +
  '<div class="card fade-in" style="padding:14px;margin-bottom:12px"><canvas id="chartPayrollTrend" height="220"></canvas></div>' +
  '<div class="section-title">KPI Distribution (RAG)</div>' +
  '<div class="card fade-in" style="padding:14px;margin-bottom:12px"><canvas id="chartKpiRag" height="160"></canvas></div>' +
  '<div class="section-title">Attendance Trend (6 Months)</div>' +
  '<div class="card fade-in" style="padding:14px;margin-bottom:12px"><canvas id="chartAttendance" height="200"></canvas></div>' +
  '<div class="section-title">Hiring Funnel</div>' +
  '<div class="card fade-in" style="padding:12px;margin-bottom:12px">' + funnelHtml + '</div>';

  // Initialize Chart.js charts after DOM update
  setTimeout(function() { initAnalyticsCharts(m); }, 50);
}

async function initAnalyticsCharts(m) {
  await loadChartJs();
  if (typeof Chart === 'undefined') return;
  var theme = getChartTheme();
  var deptColors = ['#E85D04','#D62828','#14B8A6','#22C55E','#EC4899'];

  // 1. Department Donut
  destroyChart('chartDeptDonut');
  var deptLabels = Object.keys(m.deptDist);
  var deptData = deptLabels.map(function(d) { return m.deptDist[d]; });
  var ctx1 = document.getElementById('chartDeptDonut');
  if (ctx1) {
    _chartInstances['chartDeptDonut'] = new Chart(ctx1, {
      type: 'doughnut',
      data: { labels: deptLabels, datasets: [{ data: deptData, backgroundColor: deptColors, borderWidth: 2, borderColor: theme.text === '#E5E7EB' ? '#1F2937' : '#FFFFFF' }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: theme.text, font: { size: 11 }, padding: 12 } } } }
    });
  }

  // 2. Monthly Payroll Stacked Bar (12 months FY)
  destroyChart('chartPayrollTrend');
  var payrollLabels = FY_MONTHS.map(function(f) { return f.m; });
  var depts = ['Design','Marketing','Execution','Production','QS','Admin','Accounts'];
  var datasets = depts.map(function(dept, di) {
    return {
      label: dept, backgroundColor: deptColors[di],
      data: FY_MONTHS.map(function(fm) {
        return EMPLOYEES.filter(function(e) { return e.dept === dept; })
          .reduce(function(sum, e) { return sum + generateMonthlySalary(e, fm.mi, fm.y).gross; }, 0);
      })
    };
  });
  var ctx2 = document.getElementById('chartPayrollTrend');
  if (ctx2) {
    _chartInstances['chartPayrollTrend'] = new Chart(ctx2, {
      type: 'bar',
      data: { labels: payrollLabels, datasets: datasets },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true, ticks: { color: theme.text } },
          y: { stacked: true, ticks: { color: theme.text, callback: function(v) { return 'Rs.' + Math.round(v / 100000) + 'L'; } }, grid: { color: theme.grid } }
        },
        plugins: { legend: { position: 'bottom', labels: { color: theme.text, font: { size: 10 }, padding: 8 } } }
      }
    });
  }

  // 3. KPI RAG Horizontal Bar
  destroyChart('chartKpiRag');
  var ctx3 = document.getElementById('chartKpiRag');
  if (ctx3) {
    _chartInstances['chartKpiRag'] = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: ['Green (\u226575)', 'Amber (50-74)', 'Red (<50)'],
        datasets: [{ data: [m.green, m.amber, m.red], backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'], borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y', responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: theme.text, stepSize: 5 }, grid: { color: theme.grid } },
          y: { ticks: { color: theme.text, font: { weight: '600' } } }
        }
      }
    });
  }

  // 4. Attendance Trend Line (6 months)
  destroyChart('chartAttendance');
  var startIdx = Math.max(0, activeSalaryMonth - 5);
  var last6 = FY_MONTHS.slice(startIdx, activeSalaryMonth + 1);
  var attendanceData = last6.map(function(fm) {
    if (!attendanceLogs || attendanceLogs.length === 0) return 0;
    var monthLogs = attendanceLogs.filter(function(l) { var d = new Date(l.date || l.check_in); return d.getMonth() === fm.mi && d.getFullYear() === fm.y; });
    var uniqueEmps = {};
    monthLogs.forEach(function(l) { var c = l.empCode || l.emp_code; if (c) uniqueEmps[c] = (uniqueEmps[c] || 0) + 1; });
    var empCount = Object.keys(uniqueEmps).length;
    if (empCount === 0) return 0;
    var daysInM = new Date(fm.y, fm.mi + 1, 0).getDate();
    var workingDays = 0;
    for (var d = 1; d <= daysInM; d++) { if (new Date(fm.y, fm.mi, d).getDay() !== 0) workingDays++; }
    if (workingDays === 0) return 0;
    var totalRate = 0;
    Object.keys(uniqueEmps).forEach(function(c) { totalRate += Math.min(uniqueEmps[c] / workingDays * 100, 100); });
    return Math.round(totalRate / empCount);
  });
  var ctx4 = document.getElementById('chartAttendance');
  if (ctx4) {
    _chartInstances['chartAttendance'] = new Chart(ctx4, {
      type: 'line',
      data: {
        labels: last6.map(function(f) { return f.m; }),
        datasets: [{
          label: 'Attendance %', data: attendanceData,
          borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#3B82F6', pointRadius: 5, pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { min: 80, max: 100, ticks: { color: theme.text, callback: function(v) { return v + '%'; } }, grid: { color: theme.grid } },
          x: { ticks: { color: theme.text } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

// =====================================================
// INTEGRATION: Update showOverlay() for HR overlays
// =====================================================
(function() {
  var _originalShowOverlay = showOverlay;
  showOverlay = function(id) {
    var _isManagement = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR' || currentUser.role === 'Manager');
    if (id === 'hr-recruit' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }
    if (id === 'hr-analytics' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }

    if (id === 'hr-kpi') renderKpiOverlay();
    if (id === 'hr-recruit') renderRecruitmentOverlay();
    if (id === 'hr-documents') renderDocumentsOverlay();
    if (id === 'hr-tasks') renderTasksOverlay();
    if (id === 'hr-vision') renderVisionOverlay();
    if (id === 'hr-analytics') renderAnalyticsOverlay();

    // New feature overlays (F1-F11)
    if (id === 'hr-shifts' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }
    if (id === 'hr-compliance' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }
    if (id === 'hr-assets' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }
    if (id === 'hr-exit' && currentUser && !_isManagement) {
      showToast('Access restricted to Management'); return;
    }
    if (id === 'hr-shifts') renderShiftsOverlay();
    if (id === 'hr-expenses') renderExpenseOverlay();
    if (id === 'self-service') { renderSelfServiceOverlay(); }
    if (id === 'attendance-log') renderAttendanceLogOverlay();
    if (id === 'hr-tax') { currentTaxTab = 'declaration'; renderTaxOverlay(); }
    if (id === 'hr-compliance') { currentComplianceTab = 'filing'; renderComplianceOverlay(); }
    if (id === 'hr-assets') renderAssetsOverlay();
    if (id === 'hr-exit') renderExitOverlay();
    if (id === 'hr-announcements') renderAnnouncementsOverlay();
    if (id === 'hr-celebrations') renderCelebrationsOverlay();

    _originalShowOverlay(id);
  };
})();

// Apply role-based visibility for HR tab + new dashboard widgets
(function() {
  var _originalApplyRole = applyRole;
  applyRole = function() {
    _originalApplyRole();
    var hrTab = document.querySelector('[data-tab=hr]');
    if (hrTab) {
      hrTab.style.display = '';
    }
    // Render dashboard widgets for new features
    try {
      renderCelebrationCard();
      renderAnnouncementDashboard();
    } catch(e) { /* dashboard widget error */ }
  };
})();

// =====================================================
// LOCALSTORAGE PERSISTENCE
// =====================================================
const STORAGE_KEYS = {
  // Auth & session
  jwt: 'hrms_jwt',
  session: 'hrms_session',
  // Device/UI preferences (always local)
  notifPref: 'hrms_notif_perm',
  biometricEnabled: 'hrms_biometric_enabled',
  darkMode: 'hrms_dark_mode',
  pushNotif: 'hrms_push_notif',
  mapType: 'hrms_map_type',
  captures: 'hrms_captures',
  // Local-only data (no backend endpoints)
  resumeBank: 'hrms_resume_bank',
  resumeNextId: 'hrms_resume_next_id',
  personalVisions: 'hrms_personal_visions'
};

function saveLocalOnlyData() {
  try {
    safeStorage.set(STORAGE_KEYS.resumeBank, JSON.stringify(RESUME_BANK));
    safeStorage.set(STORAGE_KEYS.resumeNextId, JSON.stringify(resumeNextId));
    safeStorage.set(STORAGE_KEYS.personalVisions, JSON.stringify(PERSONAL_VISIONS));
  } catch (e) {
    // Failed to save local data
  }
}

function loadLocalOnlyData() {
  try {
    var load = function(key) {
      var raw = safeStorage.get(key);
      if (raw) return JSON.parse(raw);
      return null;
    };
    var d;
    d = load(STORAGE_KEYS.resumeBank); if (d) { RESUME_BANK.length = 0; d.forEach(function(e) { RESUME_BANK.push(e); }); }
    d = load(STORAGE_KEYS.resumeNextId); if (d !== null) resumeNextId = d;
    d = load(STORAGE_KEYS.personalVisions); if (d) { Object.keys(PERSONAL_VISIONS).forEach(function(k) { delete PERSONAL_VISIONS[k]; }); Object.assign(PERSONAL_VISIONS, d); }
  } catch (e) {
    // Failed to load local data
  }
}

function clearAllData() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  if (!confirm('This will reset ALL data to defaults. Are you sure?')) return;
  Object.values(STORAGE_KEYS).forEach(k => safeStorage.remove(k));
  showToast('All data cleared. Refreshing...');
  setTimeout(() => location.reload(), 800);
}

// =====================================================
// DATA EXPORT / IMPORT
// =====================================================
function exportAllData() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  const data = {};
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const val = safeStorage.get(storageKey);
    if (val) try { data[storageKey] = JSON.parse(val); } catch { /* skip corrupt data */ }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hrms-backup-' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported successfully');
}

function importAllData() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('This will overwrite all current data with the imported backup. Continue?')) return;
        Object.entries(data).forEach(([key, val]) => {
          safeStorage.set(key, JSON.stringify(val));
        });
        showToast('Data imported. Reloading...');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// =====================================================
// AUTHENTICATION (API-only)
// =====================================================

// Login overrides removed — doLogin and demoLogin now handle hashed auth directly

// Auto-login from saved session — validates JWT with backend
async function tryAutoLogin() {
  try {
    var raw = safeStorage.get(STORAGE_KEYS.session);
    if (!raw) return false;
    var session = JSON.parse(raw);
    if (!session.token || Date.now() > session.expiry) {
      safeStorage.remove(STORAGE_KEYS.session);
      return false;
    }
    // Must be a real JWT (contains dots)
    if (!session.token.includes('.')) {
      safeStorage.remove(STORAGE_KEYS.session);
      return false;
    }
    JWT_TOKEN = session.token;
    // Validate token by making a lightweight API call
    if (isOnline) {
      try {
        var res = await fetch(API_BASE + '/employees?limit=1', { method: 'GET', headers: apiHeaders() });
        if (res.status === 401) {
          JWT_TOKEN = null;
          safeStorage.remove('hrms_jwt');
          safeStorage.remove(STORAGE_KEYS.session);
          return false;
        }
      } catch (e) {
        // Network error — allow login attempt anyway
      }
    }
    var empCode = session.empCode || null;
    if (!empCode) {
      safeStorage.remove(STORAGE_KEYS.session);
      return false;
    }
    await loginAs(empCode);
    return !!currentUser;
  } catch (e) { return false; }
}

// Override logout to clear session and JWT
const _origDoLogout = doLogout;
doLogout = function() {
  safeStorage.remove(STORAGE_KEYS.session);
  safeStorage.remove('hrms_jwt');
  JWT_TOKEN = null;
  if (idleTimer) clearTimeout(idleTimer);
  _origDoLogout();
};

// Idle lock — 15 min inactivity with 1 min warning
let idleTimer = null;
let idleWarningTimer = null;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (idleWarningTimer) clearTimeout(idleWarningTimer);
  // Remove warning banner if present
  const wb = document.getElementById('idleWarningBanner');
  if (wb) wb.remove();
  if (!currentUser) return;
  // Show warning at 14 min
  idleWarningTimer = setTimeout(() => {
    if (currentUser) {
      const banner = document.createElement('div');
      banner.id = 'idleWarningBanner';
      banner.setAttribute('role', 'alert');
      banner.setAttribute('aria-live', 'assertive');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#f59e0b;color:#000;text-align:center;padding:10px;font-weight:600;font-size:.85rem';
      banner.textContent = 'Your session will expire in 1 minute due to inactivity. Move mouse or press a key to stay logged in.';
      document.body.appendChild(banner);
    }
  }, 14 * 60 * 1000);
  idleTimer = setTimeout(() => {
    if (currentUser) {
      const wb = document.getElementById('idleWarningBanner');
      if (wb) wb.remove();
      showToast('Session locked due to inactivity');
      doLogout();
    }
  }, 15 * 60 * 1000);
}
['click','keydown','touchstart','scroll'].forEach(evt => {
  document.addEventListener(evt, resetIdleTimer, {passive: true});
});

// Change password — API-only
async function changePassword() {
  var oldPass = document.getElementById('chgOldPass').value;
  var newPass = document.getElementById('chgNewPass').value;
  var confirmPass = document.getElementById('chgConfirmPass').value;

  if (!oldPass) { showToast('Please enter your current password (or temp password from Forgot Password)'); return; }
  if (!newPass || !confirmPass) { showToast('Please enter and confirm your new password'); return; }
  if (newPass.length < 6) { showToast('Password must be at least 6 characters'); return; }
  if (newPass !== confirmPass) { showToast('Passwords do not match'); return; }

  var btn = document.getElementById('btnUpdatePassword');
  if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }
  try {
    await apiCall('POST', '/auth/change-password', { oldPassword: oldPass, newPassword: newPass });
    showToast('Password changed successfully!');
    document.getElementById('chgOldPass').value = '';
    document.getElementById('chgNewPass').value = '';
    document.getElementById('chgConfirmPass').value = '';
    if (btn) {
      btn.textContent = 'Updated';
      btn.className = 'btn w-full';
      btn.setAttribute('style', 'border-radius:var(--radius-sm);margin-top:8px;background:#16a34a !important;border-color:#16a34a !important;color:#fff !important');
      setTimeout(function() {
        btn.textContent = 'Update Password';
        btn.className = 'btn btn-primary w-full';
        btn.setAttribute('style', 'border-radius:var(--radius-sm);margin-top:8px');
        btn.disabled = false;
      }, 3000);
    }
  } catch (e) {
    showToast(e.message || 'Error changing password');
    if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; }
  }
}

// =====================================================
// CSV / EXCEL EXPORT
// =====================================================
function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) { showToast('No data to export'); return; }
  const headers = columns.map(c => c.label);
  const rows = data.map(row => columns.map(c => {
    let val = typeof c.key === 'function' ? c.key(row) : row[c.key];
    if (val === undefined || val === null) val = '';
    val = String(val).replace(/"/g, '""');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) val = '"' + val + '"';
    return val;
  }));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Downloaded: ' + filename);
}

function exportEmployeeList() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  var activeEmps = EMPLOYEES.filter(function(e) { return e.status !== 'Inactive'; });
  exportToCSV(activeEmps, 'employees.csv', [
    {label:'Name', key:'name'},
    {label:'Code', key:'code'},
    {label:'Department', key:'dept'},
    {label:'Designation', key:'designation'},
    {label:'Salary', key:'salary'},
    {label:'Phone', key:'phone'},
    {label:'Date of Joining', key:'doj'},
    {label:'Bank', key:'bank'},
    {label:'Role', key:'role'}
  ]);
}

function exportKPIReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  const data = EMPLOYEES.map(e => ({
    name: e.name, code: e.code, dept: e.dept,
    score: getKpiScore(e.code),
    rag: getRAGLabel(getKpiScore(e.code)),
    selfRating: KPI_DATA[e.code] ? KPI_DATA[e.code].selfRating || 'N/A' : 'N/A'
  }));
  exportToCSV(data, 'kpi_report.csv', [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'KPI Score', key:'score'},
    {label:'RAG Status', key:'rag'}, {label:'Self Rating', key:'selfRating'}
  ]);
}

function exportSalaryReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  var now = new Date();
  var monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var filename = 'salary_' + monthNames[now.getMonth()] + now.getFullYear() + '.csv';
  var activeEmps = EMPLOYEES.filter(function(e) { return e.status !== 'Inactive'; });
  exportToCSV(activeEmps, filename, [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'Designation', key:'designation'},
    {label:'Gross Salary', key:'salary'},
    {label:'Bank', key:'bank'}, {label:'Account', key:'accNo'},
    {label:'Net Pay', key:'salary'}
  ]);
}

function showAttendanceMonthPicker() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  var now = new Date();
  var prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  var prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  document.getElementById('attExportMonth').value = prevMonth;
  var yearSel = document.getElementById('attExportYear');
  yearSel.innerHTML = '';
  for (var y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
    var opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === prevYear) opt.selected = true;
    yearSel.appendChild(opt);
  }
  var overlay = document.getElementById('attendanceExportOverlay');
  overlay.style.setProperty('z-index', '100000', 'important');
  overlay.classList.add('active');
}

function closeAttendanceExportModal() {
  document.getElementById('attendanceExportOverlay').classList.remove('active');
}

async function exportAttendanceReport() {
  var selMonth = parseInt(document.getElementById('attExportMonth').value);
  var selYear = parseInt(document.getElementById('attExportYear').value);
  var monthStr = selYear + '-' + String(selMonth + 1).padStart(2, '0');
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var monthLabel = monthNames[selMonth] + '_' + selYear;
  closeAttendanceExportModal();
  showToast('Fetching attendance data...');
  try {
    var logs = await apiCall('GET', '/attendance?month=' + monthStr);
    if (!Array.isArray(logs)) logs = [];
    var daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
    var today = new Date();
    var isCurrentMonth = (today.getFullYear() === selYear && today.getMonth() === selMonth);
    var lastCountDay = isCurrentMonth ? today.getDate() : daysInMonth;
    // Count working days (exclude Sundays and declared public holidays)
    var workingDays = 0;
    for (var d = 1; d <= lastCountDay; d++) {
      var _dt = new Date(selYear, selMonth, d);
      var _ymd = selYear + '-' + String(selMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (_dt.getDay() !== 0 && !publicHolidays[_ymd]) workingDays++;
    }
    // Build empCode -> dayNum -> { present, minutes }
    var empDayData = {};
    logs.forEach(function(row) {
      if (!row.emp_code || !row.log_date) return;
      var dateStr = String(row.log_date).substring(0, 10);
      var dayNum = parseInt(dateStr.split('-')[2], 10);
      if (!empDayData[row.emp_code]) empDayData[row.emp_code] = {};
      if (!empDayData[row.emp_code][dayNum]) empDayData[row.emp_code][dayNum] = { present: true, minutes: 0 };
      if (row.check_in) {
        var start = new Date(row.check_in).getTime();
        var isToday = isCurrentMonth && dayNum === today.getDate();
        var end = row.check_out ? new Date(row.check_out).getTime() : (isToday ? Date.now() : 0);
        if (end > start) empDayData[row.emp_code][dayNum].minutes += (end - start) / 60000;
      }
    });
    // Build wide-format CSV
    var _esc = function(v) {
      v = String(v === null || v === undefined ? '' : v).replace(/"/g, '""');
      return (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) ? '"' + v + '"' : v;
    };
    var headers = ['Name', 'Employee Code'];
    for (var d = 1; d <= daysInMonth; d++) headers.push(String(d).padStart(2, '0'));
    headers.push('Total Present Days', 'Absent Days', 'Attendance %');
    var csvRows = [headers.join(',')];
    EMPLOYEES.filter(function(e) { return e.status !== 'Inactive'; }).forEach(function(emp) {
      var cols = [_esc(emp.name), _esc(emp.code)];
      var presentCount = 0;
      for (var d = 1; d <= daysInMonth; d++) {
        var dow = new Date(selYear, selMonth, d).getDay();
        var ymd = selYear + '-' + String(selMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isFuture = isCurrentMonth && d > today.getDate();
        if (dow === 0) {
          cols.push('Sun');
        } else if (publicHolidays[ymd]) {
          cols.push('Holiday');
        } else if (isFuture) {
          cols.push('');
        } else {
          var dayData = empDayData[emp.code] && empDayData[emp.code][d];
          if (dayData) {
            presentCount++;
            if (dayData.minutes > 0) {
              var h = Math.floor(dayData.minutes / 60);
              var m = Math.round(dayData.minutes % 60);
              cols.push(h + 'h ' + m + 'm');
            } else {
              cols.push('Present');
            }
          } else {
            cols.push('Absent');
          }
        }
      }
      var absentDays = Math.max(0, workingDays - presentCount);
      var attPct = workingDays > 0 ? ((presentCount / workingDays) * 100).toFixed(1) + '%' : '0.0%';
      cols.push(presentCount, absentDays, attPct);
      csvRows.push(cols.join(','));
    });
    var blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance_' + monthLabel + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Downloaded: attendance_' + monthLabel + '.csv');
  } catch (e) { showToast(e.message || 'Error exporting attendance'); }
}

function exportTaskReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  exportToCSV(TASK_DATA, 'tasks.csv', [
    {label:'Title', key:'title'}, {label:'Type', key:'type'},
    {label:'Assigned To', key:'assignedTo'}, {label:'Due Date', key:'dueDate'},
    {label:'Priority', key:'priority'},
    {label:'Status', key: t => t.done ? 'Done' : 'Pending'},
    {label:'Note', key:'note'}
  ]);
}

function exportAdvanceReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  exportToCSV(advanceRequests, 'advances.csv', [
    {label:'Employee', key:'empName'}, {label:'Code', key:'empCode'},
    {label:'Type', key:'type'}, {label:'Amount', key:'amount'},
    {label:'Status', key:'status'}, {label:'Urgency', key:'urgency'},
    {label:'Applied Date', key:'appliedDate'},
    {label:'Reviewed By', key:'reviewedBy'},
    {label:'Details', key:'details'}
  ]);
}

function calculateIncentive(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return {amount:0, percent:0, label:'N/A', score:0};
  var score = getKpiScore(empCode);
  var percent = score >= 90 ? 15 : score >= 75 ? 10 : score >= 50 ? 5 : 0;
  var label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Average' : 'Below Average';
  return {amount: Math.round(emp.salary * percent / 100), percent: percent, label: label, score: score};
}

function exportAnalyticsReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  const m = getHRMetrics();
  const data = EMPLOYEES.map(e => {
    const inc = calculateIncentive(e.code);
    return {
      name: e.name, code: e.code, dept: e.dept, salary: e.salary,
      kpi: getKpiScore(e.code), rag: getRAGLabel(getKpiScore(e.code)),
      incentivePct: inc.percent, incentiveAmt: inc.amount
    };
  });
  exportToCSV(data, 'hr_analytics.csv', [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'Salary', key:'salary'},
    {label:'KPI Score', key:'kpi'}, {label:'RAG', key:'rag'},
    {label:'Incentive %', key:'incentivePct'}, {label:'Incentive Amount', key:'incentiveAmt'}
  ]);
}

function exportIncentiveReport() {
  if (currentUser && currentUser.role === 'Employee') { showToast('Access denied. Management only.'); return; }
  const data = EMPLOYEES.map(e => {
    const inc = calculateIncentive(e.code);
    return {
      name: e.name, code: e.code, dept: e.dept, salary: e.salary,
      kpi: inc.score, label: inc.label, percent: inc.percent, amount: inc.amount
    };
  });
  exportToCSV(data, 'incentives.csv', [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'Salary', key:'salary'},
    {label:'KPI Score', key:'kpi'}, {label:'Category', key:'label'},
    {label:'Incentive %', key:'percent'}, {label:'Amount', key:'amount'}
  ]);
}

// Number to words (Indian numbering)
function numberToWords(n) {
  if (n === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function twoDigit(num) {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  }
  function threeDigit(num) {
    if (num >= 100) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + twoDigit(num % 100) : '');
    return twoDigit(num);
  }
  let words = '';
  if (n >= 10000000) { words += threeDigit(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
  if (n >= 100000) { words += twoDigit(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
  if (n >= 1000) { words += twoDigit(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
  if (n > 0) words += threeDigit(n);
  return words.trim() + ' Rupees Only';
}

// Professional PDF salary slip generator
async function downloadSalarySlip(empName, empCode, dept, salary, month, year) {
  try {
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, lm = 15, rm = 195, cw = rm - lm; // page width, left margin, right margin, content width

  const emp = EMPLOYEES.find(e => e.code === empCode) || {};
  const designation = emp.designation || dept;
  const dojRaw = emp.doj || '2020-01-01';
  const dojDate = new Date(dojRaw);
  const dojStr = dojDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const bankStr = (emp.bank || 'N/A') + ' — ' + (emp.accNo || 'N/A');

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthIdx = monthNames.findIndex(m => m.startsWith(month));
  const yr = parseInt(year, 10);
  const daysInMonth = new Date(yr, monthIdx + 1, 0).getDate();
  const periodStart = '01 ' + month + ' ' + year;
  const periodEnd = daysInMonth + ' ' + month + ' ' + year;

  // Salary breakdown
  const gross = salary;
  const basic = Math.round(gross * 0.50);
  const hra = Math.round(gross * 0.20);
  const da = Math.round(gross * 0.10);
  const otherAllow = Math.round(gross * 0.10);
  const specialAllow = gross - basic - hra - da - otherAllow;
  const pf = Math.round(gross * 0.06);
  const esi = Math.round(gross * 0.02);
  const profTax = Math.round(gross * 0.02);
  const totalDeductions = pf + esi + profTax;
  const netPay = gross - totalDeductions;

  const fmt = (v) => 'Rs.' + v.toLocaleString('en-IN');

  // Colors
  const primary = [232, 93, 4]; // #E85D04
  const primaryLight = [255, 107, 53]; // #FF6B35
  const darkText = [60, 30, 10];
  const midGray = [120, 100, 90];
  const lightBg = [255, 247, 237];
  const white = [255, 255, 255];
  const borderColor = [200, 200, 220];

  let y = 15;

  // --- HEADER with logo ---
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 30, 11); } catch(e) {
    doc.setFillColor(...primaryLight); doc.roundedRect(lm, y, 30, 11, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text('SS', lm+2.5, y+7.8);
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primary);
  doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm + 33, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...midGray);
  doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035  |  GSTIN: 33AAWCS9286M1Z6', lm + 33, y + 10);

  y += 18;
  // Divider
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.6);
  doc.line(lm, y, rm, y);

  // Title
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text('SALARY SLIP — ' + month + ' ' + year, pw / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...midGray);
  doc.text('CONFIDENTIAL', pw / 2, y, { align: 'center' });

  y += 6;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);

  // --- EMPLOYEE DETAILS TABLE ---
  y += 2;
  const detailRows = [
    ['Employee Name', empName, 'Employee Code', empCode],
    ['Department', dept, 'Designation', designation],
    ['Date of Joining', dojStr, 'Bank & Account', bankStr],
    ['Pay Period', periodStart + ' – ' + periodEnd, 'Working Days', String(daysInMonth)]
  ];
  doc.setFontSize(8);
  const col1 = lm + 2, col2 = lm + 38, col3 = lm + 95, col4 = lm + 131;
  const rowH = 7;
  detailRows.forEach((row, i) => {
    const ry = y + (i * rowH);
    if (i % 2 === 0) {
      doc.setFillColor(...lightBg);
      doc.rect(lm, ry, cw, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...midGray);
    doc.text(row[0], col1, ry + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(row[1], col2, ry + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...midGray);
    doc.text(row[2], col3, ry + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(row[3], col4, ry + 5);
  });
  y += detailRows.length * rowH + 2;

  doc.setDrawColor(...borderColor);
  doc.line(lm, y, rm, y);

  // --- EARNINGS / DEDUCTIONS ---
  y += 2;
  const midX = lm + cw / 2;

  // Headers
  doc.setFillColor(...primary);
  doc.rect(lm, y, cw / 2, 7, 'F');
  doc.rect(midX, y, cw / 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('EARNINGS', lm + (cw / 4), y + 5, { align: 'center' });
  doc.text('DEDUCTIONS', midX + (cw / 4), y + 5, { align: 'center' });
  y += 7;

  const earnings = [
    ['Basic Pay', basic],
    ['HRA', hra],
    ['Dearness Allowance', da],
    ['Other Allowances', otherAllow],
    ['Special Allowance', specialAllow]
  ];
  const deductions = [
    ['Provident Fund (6%)', pf],
    ['ESI (2%)', esi],
    ['Professional Tax (2%)', profTax]
  ];
  const maxRows = Math.max(earnings.length, deductions.length);

  for (let i = 0; i < maxRows; i++) {
    const ry = y + (i * rowH);
    if (i % 2 === 0) {
      doc.setFillColor(...lightBg);
      doc.rect(lm, ry, cw, rowH, 'F');
    }
    // Earnings
    if (earnings[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.setFontSize(8);
      doc.text(earnings[i][0], lm + 3, ry + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(earnings[i][1]), midX - 3, ry + 5, { align: 'right' });
    }
    // Deductions
    if (deductions[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.text(deductions[i][0], midX + 3, ry + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(deductions[i][1]), rm - 3, ry + 5, { align: 'right' });
    }
    // Center divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(midX, ry, midX, ry + rowH);
  }
  y += maxRows * rowH;

  // Totals row
  doc.setFillColor(230, 230, 245);
  doc.rect(lm, y, cw, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text('Total Earnings', lm + 3, y + 5);
  doc.text(fmt(gross), midX - 3, y + 5, { align: 'right' });
  doc.text('Total Deductions', midX + 3, y + 5);
  doc.text(fmt(totalDeductions), rm - 3, y + 5, { align: 'right' });
  doc.line(midX, y, midX, y + rowH);
  y += rowH + 2;

  doc.setDrawColor(...borderColor);
  doc.line(lm, y, rm, y);

  // --- NET PAY SUMMARY ---
  y += 2;
  const summaryRows = [
    ['Gross Salary', fmt(gross)],
    ['Total Deductions', '– ' + fmt(totalDeductions)],
  ];
  summaryRows.forEach((row, i) => {
    const ry = y + (i * rowH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...midGray);
    doc.text(row[0], lm + 3, ry + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(row[1], rm - 3, ry + 5, { align: 'right' });
  });
  y += summaryRows.length * rowH;

  // Net Pay highlight
  doc.setFillColor(...primary);
  doc.rect(lm, y, cw, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text('NET PAY', lm + 3, y + 6.5);
  doc.text(fmt(netPay), rm - 3, y + 6.5, { align: 'right' });
  y += 12;

  // Net Pay in words
  doc.setFillColor(...lightBg);
  doc.rect(lm, y, cw, 8, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...midGray);
  doc.text('Net Pay (in words): ' + numberToWords(netPay), lm + 3, y + 5.5);
  y += 12;

  // --- FOOTER ---
  doc.setDrawColor(...borderColor);
  doc.line(lm, y, rm, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...midGray);
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text('Generated: ' + today, lm + 2, y);
  doc.text('This is a system-generated document. No signature required.', rm - 2, y, { align: 'right' });

  // Border around entire content
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(lm - 1, 12, cw + 2, y - 7, 2, 2, 'S');

  // Save
  doc.save('Salary_' + empName.replace(/\s+/g, '_') + '_' + month + '_' + year + '.pdf');
  showToast('Salary slip downloaded');
  } catch (e) { showToast('Error generating salary slip'); }
}

// Wire download buttons via event delegation
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.download-btn');
  if (!btn) return;
  const item = btn.closest('.salary-item');
  if (!item) return;
  const name = item.querySelector('.salary-info h4')?.textContent?.trim();
  const pText = item.querySelector('.salary-info p')?.textContent || '';
  const parts = pText.split('·').map(s => s.trim().replace(/[^\w\s.()]/g, '').trim());
  const code = parts[0] || '';
  const dept = parts[1] || '';
  const valText = item.querySelector('.salary-net .value')?.textContent || '0';
  const salary = parseInt(valText.replace(/[^\d]/g, ''), 10) || 0;
  const month = item.querySelector('.salary-month .m')?.textContent?.trim() || 'Dec';
  const year = item.querySelector('.salary-month .y')?.textContent?.trim() || '2025';
  if (name && code) {
    downloadSalarySlip(name, code, dept, salary, month, year);
    addNotification('Salary Slip Downloaded', name + ' — ' + month + ' ' + year + ' slip downloaded', 'salary');
  }
});

// =====================================================
// BROWSER APIS — NOTIFICATIONS
// =====================================================
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(perm => {
      safeStorage.set(STORAGE_KEYS.notifPref, perm);
    });
  }
}

function sendNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body: body,
    icon: 'icons/icon-192.svg',
    tag: tag || 'hrms-notif',
    vibrate: [200, 100, 200]
  });
}

// Patch approve/reject to trigger notifications
(function() {
  const _origApprove = approveAdvance;
  approveAdvance = function(id) {
    _origApprove(id);
    const req = advanceRequests.find(r => r.id === id);
    if (req) sendNotification('Advance Approved', `₹${req.amount.toLocaleString('en-IN')} approved for ${req.empName}`, 'adv-' + id);
  };
})();

// =====================================================
// BROWSER APIS — GPS CHECK-IN
// =====================================================
let attendanceLogs = [];

// Selfie capture for attendance — opens front camera, returns File
function captureSelfiForAttendance() {
  return new Promise(function(resolve, reject) {
    // Create fullscreen overlay with camera
    var overlay = document.createElement('div');
    overlay.id = 'selfieOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="color:#fff;font-size:.85rem;font-weight:600;margin-bottom:10px;text-align:center">Take a selfie for attendance</div>' +
      '<video id="selfieVideo" autoplay playsinline style="width:100%;max-width:400px;max-height:60vh;border-radius:12px;object-fit:cover;transform:scaleX(-1)"></video>' +
      '<canvas id="selfieCanvas" style="display:none"></canvas>' +
      '<div style="display:flex;gap:16px;margin-top:16px">' +
      '<button id="selfieCaptureBtn" style="width:64px;height:64px;border-radius:50%;border:4px solid #fff;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center"><div style="width:48px;height:48px;border-radius:50%;background:#fff"></div></button>' +
      '</div>' +
      '<button id="selfieCancelBtn" style="margin-top:12px;background:none;border:1px solid rgba(255,255,255,0.4);color:#fff;padding:8px 24px;border-radius:8px;font-size:.78rem;cursor:pointer">Cancel</button>';
    document.body.appendChild(overlay);

    var video = document.getElementById('selfieVideo');
    var canvas = document.getElementById('selfieCanvas');
    var stream = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then(function(s) {
        stream = s;
        video.srcObject = stream;
      })
      .catch(function(err) {
        cleanup();
        showToast('Camera access denied. Please allow camera permission.');
        reject(err);
      });

    function cleanup() {
      if (stream) stream.getTracks().forEach(function(t) { t.stop(); });
      var el = document.getElementById('selfieOverlay');
      if (el) el.remove();
    }

    document.getElementById('selfieCaptureBtn').addEventListener('click', function() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext('2d');
      // Mirror the image to match what user sees
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(function(blob) {
        cleanup();
        var file = new File([blob], 'selfie_' + Date.now() + '.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.8);
    });

    document.getElementById('selfieCancelBtn').addEventListener('click', function() {
      cleanup();
      reject(new Error('Selfie cancelled'));
    });
  });
}

// ── GPS Pre-warming ──
// Start watching position as soon as the attendance screen is visible so the
// browser already has a fix cached when the user presses Check In. This
// eliminates the 10–30s GPS cold-start that was making check-in feel slow.
var _gpsWarmPos = null;
var _gpsWarmTs = 0;
var _gpsWarmWatchId = null;
function _startGpsWarm() {
  if (_gpsWarmWatchId || !navigator.geolocation) return;
  _gpsWarmWatchId = navigator.geolocation.watchPosition(
    function(pos) { _gpsWarmPos = pos; _gpsWarmTs = Date.now(); },
    function() {},
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 15000 }
  );
}
function _stopGpsWarm() {
  if (_gpsWarmWatchId && navigator.geolocation) navigator.geolocation.clearWatch(_gpsWarmWatchId);
  _gpsWarmWatchId = null;
}
// Kick off warm as soon as page loads (non-blocking)
setTimeout(_startGpsWarm, 2000);

// Fast location getter — returns cached warm position if < 30s old, otherwise
// gets a quick network fix (no GPS hardware needed for 200m geofence).
function _getLocationFast() {
  return new Promise(function(resolve, reject) {
    // Use warm cache if fresh enough
    if (_gpsWarmPos && (Date.now() - _gpsWarmTs) < 30000) {
      return resolve(_gpsWarmPos);
    }
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    // Try fast network-based location first (usually < 3s)
    navigator.geolocation.getCurrentPosition(resolve,
      function(err1) {
        // Fallback: allow slightly stale cache or try GPS
        navigator.geolocation.getCurrentPosition(resolve, reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 15000 }
    );
  });
}

function gpsCheckIn() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  var btn = document.getElementById('gpsCheckinBtn');
  if (btn) btn.textContent = 'Getting ready...';

  // Run selfie capture and GPS fetch IN PARALLEL for speed
  var selfiePromise = captureSelfiForAttendance().catch(function() { return null; });
  var gpsPromise = _getLocationFast();

  Promise.all([selfiePromise, gpsPromise]).then(function(results) {
    var selfieFile = results[0];
    var pos = results[1];
    window._attendanceSelfie = selfieFile;
    onSuccess(pos);
  }).catch(function(err) {
    showToast('Location error: ' + (err.message || err));
    if (btn) btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Check In';
  });

  async function onSuccess(pos) {
    var geoResult = checkGeofence(pos.coords.latitude, pos.coords.longitude);
    var remark = '';
    if (!geoResult.inside) {
      remark = prompt('You are outside the geofenced area. Please provide a reason:') || '';
    }
    var locationName = geoResult.inside ? geoResult.location : 'Outside geofence';
    try {
      var fd = new FormData();
      fd.append('lat', pos.coords.latitude);
      fd.append('lng', pos.coords.longitude);
      fd.append('location', locationName);
      fd.append('remark', remark);
      fd.append('isWithinGeofence', geoResult.inside);
      fd.append('accuracy', pos.coords.accuracy);
      if (window._attendanceSelfie) fd.append('selfie', window._attendanceSelfie);
      var result = await apiUpload('/attendance/checkin', fd);
      window._attendanceSelfie = null;
      // Push mapped result to local array
      if (result && result.row) {
        attendanceLogs.push(mapAttendanceLog(result.row));
      } else {
        attendanceLogs.push({
          empCode: currentUser.code, type: 'checkin',
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy, timestamp: new Date().toISOString(),
          location: locationName, remark: remark
        });
      }
    } catch (e) {
      // Fallback: push local-only if API fails
      attendanceLogs.push({
        empCode: currentUser.code, type: 'checkin',
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy, timestamp: new Date().toISOString(),
        location: locationName, remark: remark
      });
    }
    showToast('Checked in at ' + (geoResult.inside ? geoResult.location : pos.coords.latitude.toFixed(4) + '\u00B0N, ' + pos.coords.longitude.toFixed(4) + '\u00B0E'));
    addNotification('Check-In Recorded', 'Location: ' + (geoResult.inside ? geoResult.location : pos.coords.latitude.toFixed(4) + '\u00B0N'), 'checkin');
    // Notify MD & HR if outside geofence
    if (!geoResult.inside) {
      var alertMsg = currentUser.name + ' (' + currentUser.code + ') checked in OUTSIDE geofence at ' + pos.coords.latitude.toFixed(4) + '\u00B0N, ' + pos.coords.longitude.toFixed(4) + '\u00B0E' + (remark ? '. Reason: ' + remark : '');
      apiCall('POST', '/notifications', { title: 'Outside Geofence Check-In', body: alertMsg, category: 'checkin', target_emp_code: 'MD001' }).catch(function(){});
      EMPLOYEES.filter(function(e) { return e.role === 'HR'; }).forEach(function(hr) {
        apiCall('POST', '/notifications', { title: 'Outside Geofence Check-In', body: alertMsg, category: 'checkin', target_emp_code: hr.code }).catch(function(){});
      });
    }
    if (btn) btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Check In';
    updateCheckinCard(pos.coords);
    updateCheckinStatus('checkin');
    renderAttendanceLogList();
  }
}

function gpsCheckOut() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }

  // Run selfie + GPS in parallel for speed
  var selfiePromise = captureSelfiForAttendance().catch(function() { return null; });
  var gpsPromise = _getLocationFast();

  Promise.all([selfiePromise, gpsPromise]).then(function(results) {
    window._attendanceSelfie = results[0];
    onSuccess(results[1]);
  }).catch(function(err) {
    showToast('Location error: ' + (err.message || err));
  });

  async function onSuccess(pos) {
    var geoResult = checkGeofence(pos.coords.latitude, pos.coords.longitude);
    var remark = '';
    if (!geoResult.inside) {
      remark = prompt('You are outside the geofenced area. Please provide a reason:') || '';
    }
    var locationName = geoResult.inside ? geoResult.location : 'Outside geofence';
    try {
      var fd = new FormData();
      fd.append('lat', pos.coords.latitude);
      fd.append('lng', pos.coords.longitude);
      fd.append('location', locationName);
      fd.append('remark', remark);
      fd.append('isWithinGeofence', geoResult.inside);
      if (window._attendanceSelfie) fd.append('selfie', window._attendanceSelfie);
      var result = await apiUpload('/attendance/checkout', fd);
      window._attendanceSelfie = null;
      if (result && result.row) {
        attendanceLogs.push(mapAttendanceLog(result.row));
      } else {
        attendanceLogs.push({
          empCode: currentUser.code, type: 'checkout',
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy, timestamp: new Date().toISOString(),
          location: locationName, remark: remark
        });
      }
    } catch (e) {
      attendanceLogs.push({
        empCode: currentUser.code, type: 'checkout',
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy, timestamp: new Date().toISOString(),
        location: locationName, remark: remark
      });
    }
    showToast('Checked out at ' + (geoResult.inside ? geoResult.location : pos.coords.latitude.toFixed(4) + '\u00B0N, ' + pos.coords.longitude.toFixed(4) + '\u00B0E'));
    addNotification('Check-Out Recorded', 'Location: ' + (geoResult.inside ? geoResult.location : pos.coords.latitude.toFixed(4) + '\u00B0N'), 'checkout');
    if (!geoResult.inside) {
      var alertMsg = currentUser.name + ' (' + currentUser.code + ') checked out OUTSIDE geofence at ' + pos.coords.latitude.toFixed(4) + '\u00B0N, ' + pos.coords.longitude.toFixed(4) + '\u00B0E' + (remark ? '. Reason: ' + remark : '');
      apiCall('POST', '/notifications', { title: 'Outside Geofence Check-Out', body: alertMsg, category: 'checkout', target_emp_code: 'MD001' }).catch(function(){});
      EMPLOYEES.filter(function(e) { return e.role === 'HR'; }).forEach(function(hr) {
        apiCall('POST', '/notifications', { title: 'Outside Geofence Check-Out', body: alertMsg, category: 'checkout', target_emp_code: hr.code }).catch(function(){});
      });
    }
    updateCheckinStatus('checkout');
    renderAttendanceLogList();
  }
}

function updateCheckinCard(coords) {
  const locBar = document.querySelector('.checkin-hero .checkin-date') || document.querySelector('.checkin-card .checkin-date');
  if (locBar && coords) {
    locBar.textContent += ` | GPS: ${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`;
  }
}

function updateCheckinStatus(type) {
  var statusText = document.getElementById('checkinStatusText');
  var dot = document.querySelector('.checkin-status .dot');
  var checkinBtn = document.getElementById('gpsCheckinBtn');
  var checkoutBtn = document.getElementById('gpsCheckoutBtn');
  if (type === 'checkin') {
    if (statusText) statusText.textContent = 'Checked In';
    if (dot) { dot.style.background = 'var(--success)'; dot.style.animation = 'pulse 2s infinite'; }
    if (checkinBtn) { checkinBtn.className = 'btn btn-white-outline'; checkinBtn.disabled = true; checkinBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Checked In'; }
    if (checkoutBtn) { checkoutBtn.className = 'btn btn-golden'; checkoutBtn.disabled = false; checkoutBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Check Out'; }
  } else {
    if (statusText) statusText.textContent = 'Checked Out — Re-check in anytime';
    if (dot) { dot.style.background = '#F59E0B'; dot.style.animation = 'none'; }
    // After checkout, allow re-checkin
    if (checkinBtn) { checkinBtn.className = 'btn btn-golden'; checkinBtn.disabled = false; checkinBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Re-Check In'; }
    if (checkoutBtn) { checkoutBtn.className = 'btn btn-white-outline'; checkoutBtn.disabled = true; checkoutBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Checked Out'; }
  }
}

function restoreCheckinStatus() {
  if (!currentUser || typeof attendanceLogs === 'undefined') return;
  var today = new Date().toISOString().split('T')[0];
  var todayLogs = attendanceLogs.filter(function(l) { return l.empCode === currentUser.code && l.timestamp && l.timestamp.startsWith(today); });
  if (todayLogs.length === 0) return;
  var lastLog = todayLogs[todayLogs.length - 1];
  updateCheckinStatus(lastLog.type);
}

// =====================================================
// BROWSER APIS — CAMERA FOR DOCUMENT UPLOAD
// =====================================================
function openCameraCapture(targetId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = function() {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64 = e.target.result;
        // Store captured photo
        let captures; try { captures = JSON.parse(safeStorage.get(STORAGE_KEYS.captures) || '[]'); } catch { captures = []; }
        captures.push({ id: targetId, data: base64, date: new Date().toISOString() });
        // Keep only last 20 captures to manage storage
        if (captures.length > 20) captures.shift();
        safeStorage.set(STORAGE_KEYS.captures, JSON.stringify(captures));
        showToast('Photo captured successfully');
      };
      reader.readAsDataURL(input.files[0]);
    }
  };
  input.click();
}

// =====================================================
// BROWSER APIS — BIOMETRIC (WebAuthn)
// =====================================================
async function registerBiometric() {
  if (!window.PublicKeyCredential) { showToast('Biometric auth not supported on this device'); return; }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) { showToast('No platform authenticator available'); return; }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new TextEncoder().encode(currentUser.code);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: { name: 'Swetha Structures HRMS', id: location.hostname || 'localhost' },
        user: {
          id: userId,
          name: currentUser.code,
          displayName: currentUser.name
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
          requireResidentKey: false
        },
        timeout: 60000
      }
    });
    if (credential) {
      safeStorage.set('hrms_biometric_' + currentUser.code, JSON.stringify({
        credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        registered: new Date().toISOString()
      }));
      safeStorage.set(STORAGE_KEYS.biometricEnabled, 'true');
      showToast('Biometric login enabled!');
    }
  } catch (e) {
    showToast('Biometric registration failed: ' + e.message);
  }
}

async function biometricLogin() {
  if (!window.PublicKeyCredential) { showToast('Biometric login not supported on this browser'); return false; }
  try {
    // Find any registered biometric credential
    const keys = Object.keys(localStorage).filter(k => k.startsWith('hrms_biometric_'));
    if (keys.length === 0) { showToast('No biometric registered. Login first and enable in Settings.'); return false; }

    // Build allowCredentials from stored registrations
    const allowCredentials = [];
    for (const key of keys) {
      try {
        const stored = JSON.parse(safeStorage.get(key) || '{}');
        if (stored.credentialId) {
          const rawId = Uint8Array.from(atob(stored.credentialId), c => c.charCodeAt(0));
          allowCredentials.push({ type: 'public-key', id: rawId, transports: ['internal'] });
        }
      } catch (_) {}
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const opts = {
      publicKey: {
        challenge: challenge,
        rpId: location.hostname || 'localhost',
        userVerification: 'required',
        timeout: 60000
      }
    };
    if (allowCredentials.length > 0) opts.publicKey.allowCredentials = allowCredentials;

    const assertion = await navigator.credentials.get(opts);
    if (assertion) {
      // Match assertion to registered credential
      const assertionId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
      let matchedCode = null;
      for (const key of keys) {
        try {
          const stored = JSON.parse(safeStorage.get(key) || '{}');
          if (stored.credentialId === assertionId) {
            matchedCode = key.replace('hrms_biometric_', '');
            break;
          }
        } catch (_) {}
      }
      if (!matchedCode) matchedCode = keys[0].replace('hrms_biometric_', '');

      if (matchedCode) {
        // Step 1: Request a server-issued challenge to prove this request is legitimate
        try {
          var challengeResp = await fetch(API_BASE + '/auth/biometric-challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empCode: matchedCode })
          });
          var challengeData = await challengeResp.json();
          if (!challengeResp.ok) {
            showToast(challengeData.error || 'Biometric challenge failed');
            return false;
          }
          // Step 2: Send challenge + empCode to get JWT
          var resp = await fetch(API_BASE + '/auth/biometric-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empCode: matchedCode, challenge: challengeData.challenge })
          });
          var data = await resp.json();
          if (!resp.ok) {
            showToast(data.error || 'Biometric login failed. Account may be inactive.');
            return false;
          }
          JWT_TOKEN = data.token;
          safeStorage.set('hrms_jwt', data.token);
          var session = {
            empCode: matchedCode,
            token: data.token,
            expiry: Date.now() + 24 * 60 * 60 * 1000,
            rememberMe: true
          };
          safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
          await loginAs(matchedCode);
          showToast('Biometric login successful!');
          return true;
        } catch (fetchErr) {
          showToast('Biometric login failed. Please check your connection and try again.');
          return false;
        }
      }
    }
  } catch (e) {
    if (e.name === 'NotAllowedError') showToast('Biometric authentication was cancelled');
    else showToast('Biometric login failed: ' + e.message);
  }
  return false;
}

// =====================================================
// GOOGLE SIGN-IN — Redirect-based OAuth2 (works on mobile)
// =====================================================
function googleSignIn() {
  if (!GOOGLE_CLIENT_ID) {
    const err = document.getElementById('loginError');
    if (err) err.textContent = 'Google Sign-In is not configured. Contact your administrator.';
    return;
  }

  // Save state for CSRF protection
  const state = Date.now().toString(36) + Math.random().toString(36).slice(2);
  sessionStorage.setItem('hrms_google_state', state);

  // Redirect to Google OAuth2
  const redirectUri = location.origin + location.pathname;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'email profile',
    state: state,
    prompt: 'select_account'
  });
  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

// Handle OAuth2 redirect — called on page load
async function _handleGoogleRedirect() {
  // Read token from sessionStorage (captured by inline script in index.html head)
  // Falls back to location.hash if sessionStorage empty
  let hashStr = sessionStorage.getItem('hrms_google_token') || '';
  if (!hashStr) {
    const h = location.hash;
    if (h && h.includes('access_token')) hashStr = h.substring(1);
  }
  if (!hashStr) return false;
  sessionStorage.removeItem('hrms_google_token');

  const errEl = document.getElementById('loginError');

  // Parse token
  const params = new URLSearchParams(hashStr);
  const accessToken = params.get('access_token');
  const state = params.get('state');

  if (!accessToken) {
    if (errEl) errEl.textContent = 'Google Sign-In failed: no token received.';
    history.replaceState(null, '', location.pathname + location.search);
    return false;
  }

  // Verify state
  const savedState = sessionStorage.getItem('hrms_google_state');
  sessionStorage.removeItem('hrms_google_state');
  if (state && savedState && state !== savedState) {
    if (errEl) errEl.textContent = 'Google Sign-In failed: security check failed. Try again.';
    history.replaceState(null, '', location.pathname + location.search);
    return false;
  }

  // Fetch user info from Google
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!res.ok) {
      if (errEl) errEl.textContent = 'Failed to get Google profile (error ' + res.status + '). Try again.';
      history.replaceState(null, '', location.pathname + location.search);
      return false;
    }
    const userInfo = await res.json();
    if (!userInfo.email) {
      if (errEl) errEl.textContent = 'Could not read Google account email. Try again.';
      history.replaceState(null, '', location.pathname + location.search);
      return false;
    }

    // Backend-only Google auth
    var backendRes = await fetch(API_BASE + '/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userInfo.email, name: userInfo.name, picture: userInfo.picture })
    });
    var data = await backendRes.json();
    if (!backendRes.ok) {
      if (errEl) errEl.textContent = data.error || 'Google Sign-In failed. No linked employee account found.';
      history.replaceState(null, '', location.pathname + location.search);
      return false;
    }
    JWT_TOKEN = data.token;
    safeStorage.set('hrms_jwt', data.token);
    var empCode = data.user.empCode;
    var session = {
      empCode: empCode,
      token: data.token,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      rememberMe: false
    };
    safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
    history.replaceState(null, '', location.pathname + location.search);
    await loginAs(empCode);
    showToast('Signed in with Google');
    return true;
  } catch (e) {
    const errEl2 = document.getElementById('loginError');
    if (errEl2) errEl2.textContent = 'Google Sign-In failed: ' + e.message;
    history.replaceState(null, '', location.pathname + location.search);
    return false;
  }
}

// =====================================================
// PWA SERVICE WORKER REGISTRATION
// =====================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update();
      // SW registered
    }).catch(err => {
      // SW registration failed
    });
  });
}

// =====================================================
// API CLIENT — BACKEND INTEGRATION
// =====================================================
const API_BASE = (window.HRMS_API_BASE || '') + '/api';
let JWT_TOKEN = safeStorage.get('hrms_jwt') || null;
const GOOGLE_CLIENT_ID = (document.querySelector('meta[name="google-client-id"]') || {}).content || window.HRMS_GOOGLE_CLIENT_ID || '';
let isOnline = navigator.onLine;

function _showOfflineBanner() {
  let banner = document.getElementById('offlineBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offlineBanner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:#fff;text-align:center;padding:6px;font-size:13px;font-weight:600;';
    banner.textContent = 'You are offline. Changes will sync when connection is restored.';
    document.body.appendChild(banner);
  }
  banner.style.display = '';
}
function _hideOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.style.display = 'none';
}
window.addEventListener('online', () => { isOnline = true; _hideOfflineBanner(); });
window.addEventListener('offline', () => { isOnline = false; _showOfflineBanner(); });

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (JWT_TOKEN) h['Authorization'] = 'Bearer ' + JWT_TOKEN;
  return h;
}

// Universal submit button visual feedback
function _submitStart(btn) {
  if (!btn) return;
  btn._origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10"/></svg>Submitting...';
  btn.style.opacity = '0.7';
}
function _submitSuccess(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.background = 'var(--success, #22c55e)';
  btn.style.color = '#fff';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Submitted Successfully';
  setTimeout(function() {
    if (btn) { btn.style.background = ''; btn.style.color = ''; btn.innerHTML = btn._origHTML || 'Submit'; btn.disabled = false; }
  }, 3000);
}
function _submitError(btn, msg) {
  if (!btn) return;
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.background = 'var(--danger, #ef4444)';
  btn.style.color = '#fff';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' + (msg || 'Failed — Try Again');
  setTimeout(function() {
    if (btn) { btn.style.background = ''; btn.style.color = ''; btn.innerHTML = btn._origHTML || 'Submit'; }
  }, 3000);
}

async function apiCall(method, path, body) {
  if (!isOnline) throw new Error('No internet connection');
  if (!JWT_TOKEN) throw new Error('Not authenticated');
  var opts = { method: method, headers: apiHeaders() };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  var res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    JWT_TOKEN = null;
    safeStorage.remove('hrms_jwt');
    safeStorage.remove(STORAGE_KEYS.session);
    doLogout();
    throw new Error('Session expired. Please login again.');
  }
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Server error');
  return data;
}

async function apiUpload(path, formData) {
  if (!isOnline) throw new Error('No internet connection');
  if (!JWT_TOKEN) throw new Error('Not authenticated');
  var res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + JWT_TOKEN },
    body: formData
  });
  if (res.status === 401) {
    JWT_TOKEN = null; safeStorage.remove('hrms_jwt'); safeStorage.remove(STORAGE_KEYS.session);
    doLogout(); throw new Error('Session expired. Please login again.');
  }
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Server error');
  return data;
}

// =====================================================
// DB-FIRST: Entity Mappers (snake_case → camelCase)
// =====================================================
function mapEmployee(row) {
  return {
    code: row.code, name: row.name, dept: row.dept,
    designation: row.designation || '', salary: parseFloat(row.salary) || 0,
    bank: row.bank || '', accNo: row.acc_no || row.accNo || '',
    role: row.role || 'Employee', phone: row.phone || '',
    doj: row.doj ? String(row.doj).substring(0, 10) : '',
    email: row.email || '', address: row.address || '',
    emergencyContact: row.emergency_contact || '', emergencyPhone: row.emergency_phone || '',
    photoUrl: row.photo_url || '',
    status: row.is_active === 0 ? 'Inactive' : 'Active',
    dob: row.dob ? String(row.dob).substring(0, 10) : (EMP_DOB_MAP[row.code] || ''),
    presentAddress: row.present_address || '', permanentAddress: row.permanent_address || '',
    fatherName: row.father_name || '', fatherMobile: row.father_mobile || '',
    motherName: row.mother_name || '', motherMobile: row.mother_mobile || '',
    spouseName: row.spouse_name || '', spouseMobile: row.spouse_mobile || '',
    bloodGroup: row.blood_group || '', pan: row.pan || '', aadhaar: row.aadhaar || '',
    uan: row.uan || '', qualification: row.qualification || '',
    institution: row.institution || '', yearOfPassing: row.year_of_passing || '',
    previousEmployer: row.previous_employer || '', previousRole: row.previous_role || '',
    yearsOfExperience: row.years_of_experience != null ? parseFloat(row.years_of_experience) : '',
    maritalStatus: row.marital_status || ''
  };
}
function mapLeave(row) {
  return {
    id: row.id, empCode: row.emp_code || row.empCode, empName: row.emp_name || row.empName || '',
    dept: row.dept || '', type: row.leave_type || row.type || 'casual',
    from: row.from_date ? String(row.from_date).substring(0, 10) : (row.from || ''),
    to: row.to_date ? String(row.to_date).substring(0, 10) : (row.to || ''),
    days: parseInt(row.days, 10) || 1, reason: row.reason || '',
    status: row.status || 'pending',
    reviewedBy: row.reviewed_by || row.reviewedBy || null,
    reviewDate: row.review_date ? String(row.review_date).substring(0, 10) : (row.reviewDate || null)
  };
}
function mapAdvance(row) {
  return {
    id: row.id, type: row.type || 'site',
    empCode: row.emp_code || row.empCode || '', empName: row.emp_name || row.empName || '',
    dept: row.dept || '', amount: parseFloat(row.amount) || 0,
    reason: row.reason || null, details: row.details || null,
    project: row.project || null, category: row.category || null,
    travelFrom: row.travel_from || row.travelFrom || null,
    travelTo: row.travel_to || row.travelTo || null,
    vehicle: row.vehicle || null, travelKm: row.travel_km ? parseFloat(row.travel_km) : (row.travelKm || null),
    emiAmount: row.emi_amount ? parseFloat(row.emi_amount) : (row.emiAmount || null),
    emiMonths: row.emi_months ? parseInt(row.emi_months, 10) : (row.emiMonths || null),
    urgency: row.urgency || 'normal',
    status: (row.status || 'Pending').toLowerCase(),
    appliedDate: row.applied_date ? String(row.applied_date).substring(0, 10) : (row.appliedDate || ''),
    reviewedBy: row.reviewed_by || row.reviewedBy || null,
    reviewDate: row.review_date ? String(row.review_date).substring(0, 10) : (row.reviewDate || null),
    rejectReason: row.reject_reason || row.rejectReason || null,
    paidBy: row.paid_by || row.paidBy || null,
    paidDate: row.paid_date ? String(row.paid_date).substring(0, 10) : (row.paidDate || null)
  };
}
function mapAnnouncement(row) {
  return {
    id: row.id, title: row.title || '',
    body: row.content || row.body || '',
    category: row.category || row.type || 'General',
    author: row.created_by || row.author || '',
    date: row.created_at ? String(row.created_at).substring(0, 10) : (row.date || ''),
    priority: row.priority || 'normal',
    readBy: row.readBy || []
  };
}
function mapTask(row) {
  return {
    id: row.id, title: row.title || '', type: row.type || 'routine',
    assignedTo: row.assigned_to || row.assignedTo || '',
    dueDate: row.due_date ? String(row.due_date).substring(0, 10) : (row.dueDate || ''),
    priority: row.priority || 'medium',
    done: !!(row.done),
    note: row.note || row.description || ''
  };
}
function mapExpense(row) {
  return {
    id: row.id, empCode: row.emp_code || row.empCode || '',
    empName: row.emp_name || row.empName || '',
    category: row.category || '', amount: parseFloat(row.amount) || 0,
    description: row.description || '', receiptUrl: row.receipt_url || row.receiptUrl || '',
    status: row.status || 'Pending',
    reviewedBy: row.reviewed_by || row.reviewedBy || null,
    reviewDate: row.review_date ? String(row.review_date).substring(0, 10) : (row.reviewDate || null),
    submittedOn: row.submitted_at ? String(row.submitted_at).substring(0, 10) : (row.submittedOn || ''),
    expenseType: row.expense_type || row.expenseType || '',
    project: row.project || '',
    travelFrom: row.travel_from || row.travelFrom || '',
    travelTo: row.travel_to || row.travelTo || '',
    vehicle: row.vehicle || '',
    travelKm: row.travel_km != null ? parseInt(row.travel_km, 10) : (row.travelKm != null ? parseInt(row.travelKm, 10) : null),
    travelDays: row.travel_days != null ? parseInt(row.travel_days, 10) : (row.travelDays != null ? parseInt(row.travelDays, 10) : null),
    date: row.expense_date ? String(row.expense_date).substring(0, 10) : (row.date || ''),
    billUrl: row.bill_url || row.billUrl || '',
    paidBy: row.paid_by || row.paidBy || null,
    paidDate: row.paid_date ? String(row.paid_date).substring(0, 10) : (row.paidDate || null)
  };
}
function mapAsset(row) {
  return {
    id: row.id, name: row.asset_name || row.name || '',
    type: row.asset_type || row.type || '', serialNo: row.serial_no || row.serialNo || '',
    purchaseDate: row.purchase_date ? String(row.purchase_date).substring(0, 10) : (row.purchaseDate || ''),
    cost: parseFloat(row.purchase_cost || row.cost) || 0,
    condition: row.asset_condition || row.condition || 'New',
    status: row.status || 'Available',
    assignedTo: row.assigned_to || row.assignedTo || null,
    assignedDate: row.assigned_date ? String(row.assigned_date).substring(0, 10) : (row.assignedDate || null),
    assignedBy: row.assigned_by || row.assignedBy || null,
    notes: row.notes || ''
  };
}
function mapExitRequest(row) {
  return {
    id: row.id, empCode: row.emp_code || row.empCode || '',
    empName: row.emp_name || row.empName || '',
    reason: row.reason || '', remarks: row.remarks || '',
    preferredLWD: row.preferred_lwd ? String(row.preferred_lwd).substring(0, 10) : (row.preferredLWD || ''),
    actualLWD: row.actual_lwd ? String(row.actual_lwd).substring(0, 10) : (row.actualLWD || null),
    status: row.status || 'Pending',
    reviewedBy: row.reviewed_by || row.reviewedBy || null,
    reviewDate: row.review_date ? String(row.review_date).substring(0, 10) : (row.reviewDate || null),
    clearance: row.clearance || null,
    fnfAmount: row.fnf_amount ? parseFloat(row.fnf_amount) : (row.fnfAmount || null),
    fnfDetails: row.fnf_details || row.fnfDetails || null,
    submittedAt: row.submitted_at ? String(row.submitted_at).substring(0, 10) : (row.submittedAt || '')
  };
}
function mapComplianceFiling(row) {
  return {
    id: row.id, type: row.filing_type || row.type || '',
    period: row.period || '', dueDate: row.due_date ? String(row.due_date).substring(0, 10) : (row.dueDate || ''),
    filedDate: row.filed_date ? String(row.filed_date).substring(0, 10) : (row.filedDate || null),
    status: row.status || 'pending',
    filedBy: row.filed_by || row.filedBy || null,
    authority: row.authority || '', referenceNo: row.reference_no || row.referenceNo || ''
  };
}
function mapContractWorker(row) {
  return {
    id: row.id, name: row.name || '', contractor: row.contractor || '',
    dept: row.dept || '', dailyWage: parseFloat(row.daily_wage || row.dailyWage) || 0,
    startDate: row.start_date ? String(row.start_date).substring(0, 10) : (row.startDate || ''),
    endDate: row.end_date ? String(row.end_date).substring(0, 10) : (row.endDate || null),
    isActive: row.is_active !== 0
  };
}
function mapJobPosting(row) {
  return {
    id: row.id, title: row.title || '', dept: row.dept || '',
    openings: row.openings || 1,
    posted: row.posted_date ? String(row.posted_date).substring(0, 10) : (row.posted || ''),
    status: (row.status || 'Open').toLowerCase(),
    jd: row.description || row.jd || '',
    location: row.location || '', type: row.type || 'Full-time',
    experience: row.experience || '', salaryRange: row.salary_range || row.salaryRange || '',
    requirements: row.requirements || ''
  };
}
function mapCandidate(row) {
  return {
    id: row.id, name: row.name || '', email: row.email || '',
    phone: row.phone || '', jobId: row.job_id || row.jobId || null,
    role: row.job_title || row.role || '',
    stage: row.stage || 'Applied', rating: parseFloat(row.rating) || 0,
    resumeUrl: row.resume_url || row.resumeUrl || '',
    notes: row.notes || '', exp: row.exp || '',
    appliedDate: row.applied_date ? String(row.applied_date).substring(0, 10) : (row.appliedDate || ''),
    aiScore: row.ai_score || row.aiScore || null,
    aiSummary: row.ai_summary || row.aiSummary || null,
    aiStrengths: row.ai_strengths || row.aiStrengths || null
  };
}
function mapNotification(row) {
  return {
    id: row.id, empCode: row.emp_code || row.empCode || '',
    title: row.title || '', body: row.message || row.body || '',
    category: row.type || row.category || 'system',
    time: row.created_at || row.time || '',
    read: !!(row.is_read || row.read)
  };
}
function mapTaxDeclaration(row) {
  return {
    empCode: row.emp_code || row.empCode || '',
    fy: row.fy || '2025-26',
    section80c: parseFloat(row.section_80c || row.section80c) || 0,
    section80d: parseFloat(row.section_80d || row.section80d) || 0,
    hraExemption: parseFloat(row.hra_exemption || row.hraExemption) || 0,
    homeLoanInterest: parseFloat(row.home_loan_interest || row.homeLoanInterest) || 0,
    annualIncome: parseFloat(row.annual_income || row.annualIncome) || 0,
    totalDeductions: parseFloat(row.total_deductions || row.totalDeductions) || 0,
    taxableIncome: parseFloat(row.taxable_income || row.taxableIncome) || 0,
    taxLiability: parseFloat(row.tax_liability || row.taxLiability) || 0,
    monthlyTds: parseFloat(row.monthly_tds || row.monthlyTds) || 0
  };
}
function mapAttendanceLog(row) {
  var ts = row.check_in || row.timestamp || row.created_at || '';
  return {
    id: row.id,
    empCode: row.emp_code || row.empCode || '',
    type: row.check_out ? 'checkout' : 'checkin',
    lat: parseFloat(row.check_in_lat || row.lat) || 0,
    lng: parseFloat(row.check_in_lng || row.lng) || 0,
    checkOutLat: parseFloat(row.check_out_lat) || 0,
    checkOutLng: parseFloat(row.check_out_lng) || 0,
    accuracy: parseFloat(row.accuracy) || 0,
    timestamp: ts ? new Date(ts).toISOString() : new Date().toISOString(),
    checkIn: row.check_in ? new Date(row.check_in).toISOString() : null,
    checkOut: row.check_out ? new Date(row.check_out).toISOString() : null,
    location: row.location_name || row.location || '',
    remark: row.remark || '',
    status: row.status || 'Present',
    logDate: row.log_date || '',
    isWithinGeofence: row.is_within_geofence !== undefined ? !!row.is_within_geofence : true,
    name: row.name || '',
    dept: row.dept || ''
  };
}
function mapGeofenceSite(row) {
  return {
    id: row.id,
    name: row.name || '',
    lat: parseFloat(row.lat) || 0,
    lng: parseFloat(row.lng) || 0,
    radius: parseInt(row.radius, 10) || 200,
    isActive: row.is_active !== undefined ? !!row.is_active : true
  };
}
function mapProject(row) {
  return {
    id: row.id,
    name: row.name || '',
    client: row.client || '',
    location: row.location || '',
    budget: parseFloat(row.budget) || 0,
    status: row.status || 'Not Started',
    startDate: row.start_date || row.startDate || '',
    targetDate: row.target_date || row.targetDate || '',
    createdBy: row.created_by || row.createdBy || '',
    contractorName: row.contractor_name || row.contractorName || 'Swetha Structures Pvt Ltd',
    siteLocation: row.site_location || row.siteLocation || '',
    projectLead: row.project_lead || row.projectLead || '',
    tasks: (row.tasks || []).map(mapProjectTask),
    team: row.team || [],
    materials: (row.materials || []).map(mapProjectMaterial),
    wbsTasks: (row.wbs_tasks || row.wbsTasks || []).map(mapWBSTask)
  };
}
function mapProjectTask(row) {
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    priority: row.priority || 'Medium',
    assignedTo: row.assigned_to || row.assignedTo || '',
    status: row.status || 'Pending',
    dueDate: row.due_date || row.dueDate || '',
    createdDate: row.created_at || row.createdDate || ''
  };
}
function mapProjectMaterial(row) {
  return {
    id: row.id,
    projectId: row.project_id || row.projectId,
    name: row.name || '',
    unit: row.unit || '',
    total: parseFloat(row.total) || 0,
    used: parseFloat(row.used) || 0,
    remaining: parseFloat(row.remaining) || 0
  };
}
function mapWBSTask(row) {
  return {
    id: row.id,
    projectId: row.project_id || row.projectId,
    wbsCode: row.wbs_code || row.wbsCode || '',
    level: parseInt(row.level, 10) || 1,
    taskName: row.task_name || row.taskName || '',
    lead: row.lead || '',
    predecessor: row.predecessor || '',
    startDate: row.start_date || row.startDate || '',
    endDate: row.end_date || row.endDate || '',
    actualStart: row.actual_start || row.actualStart || '',
    actualEnd: row.actual_end || row.actualEnd || '',
    plannedDays: parseInt(row.planned_days, 10) || 0,
    workDays: parseInt(row.work_days, 10) || 0,
    progressPct: parseFloat(row.progress_pct || row.progressPct) || 0,
    status: row.status || 'pending'
  };
}
function mapBOQSheet(row) {
  return {
    id: row.id,
    projectId: row.project_id || row.projectId,
    sheetType: row.sheet_type || row.sheetType || 'civil',
    title: row.title || '',
    areaSqft: parseFloat(row.area_sqft || row.areaSqft) || 0,
    quotedRate: parseFloat(row.quoted_rate_per_sqft || row.quotedRate) || 0,
    totalPlannedAmount: parseFloat(row.total_planned_amount || row.totalPlannedAmount) || 0,
    items: (row.items || []).map(mapBOQItem)
  };
}
function mapBOQItem(row) {
  return {
    id: row.id,
    boqSheetId: row.boq_sheet_id || row.boqSheetId,
    projectId: row.project_id || row.projectId,
    itemNo: row.item_no || row.itemNo || '',
    isCategory: !!(row.is_category || row.isCategory),
    description: row.description || '',
    unit: row.unit || '',
    plannedQty: parseFloat(row.planned_qty || row.plannedQty) || 0,
    rate: parseFloat(row.rate) || 0,
    plannedAmount: parseFloat(row.planned_amount || row.plannedAmount) || 0,
    actualQtyUsed: parseFloat(row.actual_qty_used || row.actualQtyUsed) || 0,
    isPending: !!(row.is_pending || row.isPending)
  };
}
function mapDailyWorkLog(row) {
  return {
    id: row.id,
    projectId: row.project_id || row.projectId,
    taskId: row.task_id || row.taskId || null,
    taskName: row.task_name || row.taskName || '',
    wbsCode: row.wbs_code || row.wbsCode || '',
    logDate: row.log_date || row.logDate || '',
    loggedBy: row.logged_by || row.loggedBy || '',
    workersCount: parseInt(row.workers_count || row.workersCount, 10) || 0,
    weather: row.weather || '',
    workDescription: row.work_description || row.workDescription || '',
    materialsNote: row.materials_note || row.materialsNote || '',
    progressUpdate: parseFloat(row.progress_update || row.progressUpdate) || 0,
    remarks: row.remarks || '',
    createdAt: row.created_at || row.createdAt || ''
  };
}
function mapUsageLog(row) {
  return {
    id: row.id,
    boqItemId: row.boq_item_id || row.boqItemId,
    projectId: row.project_id || row.projectId,
    qtyUsed: parseFloat(row.qty_used || row.qtyUsed) || 0,
    note: row.note || '',
    loggedBy: row.logged_by || row.loggedBy || '',
    loggedAt: row.logged_at || row.loggedAt || ''
  };
}
function mapDocument(row) {
  return {
    id: row.id,
    empCode: row.emp_code || row.empCode || '',
    empName: row.emp_name || '',
    docType: row.doc_type || row.docType || 'general',
    docName: row.doc_name || row.docName || '',
    filePath: row.file_path || row.filePath || '',
    fileSize: row.file_size || row.fileSize || 0,
    mimeType: row.mime_type || row.mimeType || '',
    isGenerated: !!(row.is_generated || row.isGenerated),
    uploadedAt: row.uploaded_at || row.uploadedAt || ''
  };
}

// =====================================================
// DB-FIRST: Load All Shared Data from Backend
// =====================================================
async function loadFromBackend() {
  if (!isOnline) throw new Error('No internet connection');
  if (!JWT_TOKEN) throw new Error('Not authenticated');
  try {
    // Determine role from currentUser OR from JWT session (currentUser may not be set yet on first login)
    var userRole = (currentUser && currentUser.role) || '';
    if (!userRole && JWT_TOKEN) {
      try { var payload = JSON.parse(atob(JWT_TOKEN.split('.')[1])); userRole = payload.role || ''; } catch(e) {}
    }
    var isMDorHR = userRole === 'MD' || userRole === 'HR';
    var headers = apiHeaders();
    var fetchOpts = { method: 'GET', headers: headers };
    var base = API_BASE;

    // Build request list — 23 parallel fetches
    var curMonth = new Date().toISOString().slice(0, 7);
    var requests = [
      { key: 'employees', url: base + '/employees?limit=200' },
      { key: 'leaves', url: base + '/leaves?limit=500' },
      { key: 'advances', url: base + '/advances?limit=500' },
      { key: 'notifications', url: base + '/notifications' },
      { key: 'notifPrefs', url: base + '/notifications/prefs' },
      { key: 'announcements', url: base + '/announcements?limit=200' },
      { key: 'tasks', url: base + '/tasks?limit=200' },
      { key: 'assets', url: base + '/assets?limit=200' },
      { key: 'exits', url: base + '/exit?limit=200' },
      { key: 'expenses', url: base + '/expenses?limit=500' },
      { key: 'shifts', url: base + '/shifts' },
      { key: 'shiftTypes', url: base + '/shifts/types' },
      { key: 'tax', url: base + '/tax' },
      { key: 'attendance', url: base + '/attendance?month=' + curMonth },
      { key: 'missedAttendance', url: base + '/attendance/missed' },
      { key: 'geofenceSites', url: base + '/geofence/sites' },
      { key: 'projects', url: base + '/projects' },
      { key: 'documents', url: base + '/documents' },
      { key: 'departments', url: base + '/departments' }
    ];
    // MD/HR-only endpoints
    if (isMDorHR) {
      requests.push({ key: 'jobs', url: base + '/recruitment/jobs' });
      requests.push({ key: 'candidates', url: base + '/recruitment/candidates' });
      requests.push({ key: 'leaveBalanceAll', url: base + '/leaves/balance/all' });
      requests.push({ key: 'complianceFilings', url: base + '/compliance/filings' });
      requests.push({ key: 'contractWorkers', url: base + '/compliance/contract-workers' });
      requests.push({ key: 'kpiAll', url: base + '/kpi' });
    } else {
      requests.push({ key: 'leaveBalance', url: base + '/leaves/balance' });
    }

    var results = await Promise.allSettled(
      requests.map(function(r) {
        return fetch(r.url, fetchOpts).then(function(res) {
          if (!res.ok) return null;
          return res.json();
        }).catch(function() { return null; });
      })
    );

    // Helper to extract data from result
    function getData(idx) {
      var r = results[idx];
      if (!r || r.status !== 'fulfilled' || !r.value) return null;
      return r.value;
    }

    // Helper to unwrap paginated or array responses
    function unwrap(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
      return [];
    }

    // Map request keys to indices
    var keyIdx = {};
    requests.forEach(function(r, i) { keyIdx[r.key] = i; });

    // 1. Employees
    var empData = unwrap(getData(keyIdx.employees));
    if (empData.length > 0) {
      var mapped = empData.map(mapEmployee);
      EMPLOYEES.length = 0;
      mapped.forEach(function(e) { EMPLOYEES.push(e); });
      // Re-apply DOB map
      EMPLOYEES.forEach(function(e) { if (EMP_DOB_MAP[e.code]) e.dob = EMP_DOB_MAP[e.code]; });
      // Ensure core accounts active
      EMPLOYEES.forEach(function(e) { if (e.code === 'MD001' || e.code === 'HR001' || e.code === 'SS001') e.status = 'Active'; });
    }

    // 2. Leaves
    var leaveData = unwrap(getData(keyIdx.leaves));
    if (leaveData.length > 0) {
      leaveApplications.length = 0;
      leaveData.map(mapLeave).forEach(function(l) { leaveApplications.push(l); });
      leaveNextId = leaveApplications.reduce(function(mx, l) { return Math.max(mx, l.id || 0); }, 0) + 1;
    }

    // 3. Leave balances
    if (isMDorHR && keyIdx.leaveBalanceAll !== undefined) {
      var balData = getData(keyIdx.leaveBalanceAll);
      if (balData && typeof balData === 'object' && !Array.isArray(balData)) {
        Object.keys(leaveBalances).forEach(function(k) { delete leaveBalances[k]; });
        Object.assign(leaveBalances, balData);
      }
    } else if (keyIdx.leaveBalance !== undefined) {
      var myBal = getData(keyIdx.leaveBalance);
      if (myBal && currentUser) {
        leaveBalances[currentUser.code] = myBal;
      }
    }

    // 4. Advances
    var advData = unwrap(getData(keyIdx.advances));
    if (advData.length > 0) {
      advanceRequests.length = 0;
      advData.map(mapAdvance).forEach(function(a) { advanceRequests.push(a); });
      advNextId = advanceRequests.reduce(function(mx, a) { return Math.max(mx, a.id || 0); }, 0) + 1;
    }

    // 5. Notifications
    var notifData = getData(keyIdx.notifications);
    if (notifData && Array.isArray(notifData)) {
      NOTIF_HISTORY.length = 0;
      notifData.map(mapNotification).forEach(function(n) { NOTIF_HISTORY.push(n); });
    }

    // 6. Notification preferences
    var prefData = getData(keyIdx.notifPrefs);
    if (prefData && typeof prefData === 'object') {
      Object.assign(notifPrefs, prefData);
    }

    // 7. Announcements
    var annData = unwrap(getData(keyIdx.announcements));
    if (annData.length > 0) {
      announcements.length = 0;
      annData.map(mapAnnouncement).forEach(function(a) { announcements.push(a); });
      // Only consider numeric ids when computing nextId (holiday-* are virtual string ids)
      announcementNextId = announcements.reduce(function(mx, a) {
        return typeof a.id === 'number' ? Math.max(mx, a.id) : mx;
      }, 0) + 1;
    }

    // 8. Tasks
    var taskData = getData(keyIdx.tasks);
    if (taskData && Array.isArray(taskData) && taskData.length > 0) {
      TASK_DATA.length = 0;
      taskData.map(mapTask).forEach(function(t) { TASK_DATA.push(t); });
    }

    // 9. Job postings
    var jobData = getData(keyIdx.jobs);
    if (jobData && Array.isArray(jobData) && jobData.length > 0) {
      JOB_POSTINGS.length = 0;
      jobData.map(mapJobPosting).forEach(function(j) { JOB_POSTINGS.push(j); });
      jobNextId = JOB_POSTINGS.reduce(function(mx, j) { return Math.max(mx, j.id || 0); }, 0) + 1;
    }

    // 10. Candidates
    var candData = getData(keyIdx.candidates);
    if (candData && Array.isArray(candData) && candData.length > 0) {
      CANDIDATES.length = 0;
      candData.map(mapCandidate).forEach(function(c) { CANDIDATES.push(c); });
      candidateNextId = CANDIDATES.reduce(function(mx, c) { return Math.max(mx, c.id || 0); }, 0) + 1;
    }

    // 11. Assets
    var assetData = unwrap(getData(keyIdx.assets));
    if (assetData.length > 0) {
      assetInventory.length = 0;
      assetData.map(mapAsset).forEach(function(a) { assetInventory.push(a); });
      assetNextId = assetInventory.reduce(function(mx, a) { return Math.max(mx, a.id || 0); }, 0) + 1;
    }

    // 12. Exit requests
    var exitData = getData(keyIdx.exits);
    if (exitData && Array.isArray(exitData) && exitData.length > 0) {
      exitRequests.length = 0;
      exitData.map(mapExitRequest).forEach(function(e) { exitRequests.push(e); });
      exitNextId = exitRequests.reduce(function(mx, e) { return Math.max(mx, e.id || 0); }, 0) + 1;
    }

    // 13. Expenses
    var expData = unwrap(getData(keyIdx.expenses));
    if (expData.length > 0) {
      expenseReimbursements.length = 0;
      expData.map(mapExpense).forEach(function(e) { expenseReimbursements.push(e); });
      expReimbNextId = expenseReimbursements.reduce(function(mx, e) { return Math.max(mx, e.id || 0); }, 0) + 1;
    }

    // 14. Shifts
    var shiftData = getData(keyIdx.shifts);
    if (shiftData && Array.isArray(shiftData) && shiftData.length > 0) {
      Object.keys(shiftAssignments).forEach(function(k) { delete shiftAssignments[k]; });
      shiftData.forEach(function(row) {
        shiftAssignments[row.emp_code || row.empCode] = {
          shiftCode: row.shift_code || row.code || 'GEN',
          eligible: !!(row.is_eligible !== undefined ? row.is_eligible : true)
        };
      });
    }

    // 14b. Shift types from DB
    if (keyIdx.shiftTypes !== undefined) {
      var stData = getData(keyIdx.shiftTypes);
      if (stData && Array.isArray(stData) && stData.length > 0) {
        SHIFT_TYPES.length = 0;
        stData.forEach(function(row) {
          SHIFT_TYPES.push({ code: row.code, name: row.name, start: row.start_time || row.start, end: row.end_time || row.end, color: row.color || '#2563EB' });
        });
      }
    }

    // 15. Tax declaration
    var taxData = getData(keyIdx.tax);
    if (taxData && typeof taxData === 'object' && taxData.emp_code) {
      var mapped = mapTaxDeclaration(taxData);
      taxDeclarations[mapped.empCode] = mapped;
    }

    // 16. Compliance filings (MD/HR only)
    if (isMDorHR && keyIdx.complianceFilings !== undefined) {
      var compData = getData(keyIdx.complianceFilings);
      if (compData && Array.isArray(compData) && compData.length > 0) {
        complianceFilings.length = 0;
        compData.map(mapComplianceFiling).forEach(function(c) { complianceFilings.push(c); });
        complianceNextId = complianceFilings.reduce(function(mx, c) { return Math.max(mx, c.id || 0); }, 0) + 1;
      }
    }

    // 17. Contract workers (MD/HR only)
    if (isMDorHR && keyIdx.contractWorkers !== undefined) {
      var cwData = getData(keyIdx.contractWorkers);
      if (cwData && Array.isArray(cwData) && cwData.length > 0) {
        contractWorkers.length = 0;
        cwData.map(mapContractWorker).forEach(function(w) { contractWorkers.push(w); });
        contractWorkerNextId = contractWorkers.reduce(function(mx, w) { return Math.max(mx, w.id || 0); }, 0) + 1;
      }
    }

    // 18. Attendance logs
    if (keyIdx.attendance !== undefined) {
      var attData = getData(keyIdx.attendance);
      if (attData && Array.isArray(attData) && attData.length > 0) {
        attendanceLogs.length = 0;
        attData.map(mapAttendanceLog).forEach(function(a) { attendanceLogs.push(a); });
      }
    }

    // 18b. Missed attendance requests
    if (keyIdx.missedAttendance !== undefined) {
      var missedData = unwrap(getData(keyIdx.missedAttendance));
      window._missedAttRequests = missedData || [];
    }

    // 19. Geofence sites
    if (keyIdx.geofenceSites !== undefined) {
      var geoData = getData(keyIdx.geofenceSites);
      if (geoData && Array.isArray(geoData) && geoData.length > 0) {
        siteLocations.length = 0;
        geoData.map(mapGeofenceSite).forEach(function(s) { siteLocations.push(s); });
      }
    }

    // 20. Projects
    if (keyIdx.projects !== undefined) {
      var projData = getData(keyIdx.projects);
      if (projData && Array.isArray(projData) && projData.length > 0) {
        projects.length = 0;
        projData.map(mapProject).forEach(function(p) { projects.push(p); });
        projectNextId = projects.reduce(function(mx, p) { return Math.max(mx, p.id || 0); }, 0) + 1;
        // Rebuild projectTaskNextIds from DB data
        Object.keys(projectTaskNextIds).forEach(function(k) { delete projectTaskNextIds[k]; });
        projects.forEach(function(p) {
          var maxTaskId = (p.tasks || []).reduce(function(mx, t) { return Math.max(mx, t.id || 0); }, 0);
          projectTaskNextIds[p.id] = maxTaskId + 1;
        });
        // Rebuild projectMaterials from DB data
        projectMaterials.length = 0;
        projects.forEach(function(p) {
          (p.materials || []).forEach(function(m) { projectMaterials.push(m); });
        });
      }
    }

    // 21. KPI data (MD/HR)
    if (isMDorHR && keyIdx.kpiAll !== undefined) {
      var kpiAllData = getData(keyIdx.kpiAll);
      if (kpiAllData && Array.isArray(kpiAllData)) {
        Object.keys(KPI_DATA).forEach(function(k) { delete KPI_DATA[k]; });
        kpiAllData.forEach(function(row) {
          var code = row.emp_code || row.empCode;
          if (!KPI_DATA[code]) KPI_DATA[code] = { scores: [], selfRatings: [] };
          KPI_DATA[code].scores.push(row);
        });
      }
    }

    // 22. Documents
    if (keyIdx.documents !== undefined) {
      var docData = getData(keyIdx.documents);
      if (docData && Array.isArray(docData)) {
        EMPLOYEE_DOCUMENTS.length = 0;
        docData.map(mapDocument).forEach(function(d) { EMPLOYEE_DOCUMENTS.push(d); });
      }
    }

    // 23. Departments from DB
    if (keyIdx.departments !== undefined) {
      var deptData = getData(keyIdx.departments);
      if (deptData && Array.isArray(deptData) && deptData.length > 0) {
        departments.length = 0;
        departmentData = deptData;
        deptData.forEach(function(d) { departments.push(d.name); });
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

// Offline mutation queue removed — DB is the sole source of truth


// =====================================================
// ROLE-SPECIFIC NAVIGATION RENDERER
// =====================================================
function filterNavByDept(items) {
  if (!currentUser) return items;
  return items.filter(function(item) {
    if (item.deptOnly && item.deptOnly.indexOf(currentUser.dept) === -1) {
      // Bypass dept restriction if SuperAdmin granted access to this or any child feature
      var keys = [];
      var pk = NAV_FEATURE_MAP[item.id];
      if (pk) keys.push(pk);
      if (item.children) {
        item.children.forEach(function(c) {
          var ck = NAV_FEATURE_MAP[c.id];
          if (ck && keys.indexOf(ck) === -1) keys.push(ck);
        });
      }
      for (var i = 0; i < keys.length; i++) {
        if (_myFeatureAccess[keys[i]] && _myFeatureAccess[keys[i]].enabled) return true;
      }
      return false;
    }
    return true;
  });
}

// Map nav item IDs to feature keys for SuperAdmin access gating.
// Only the top-level nav items are gated — children inherit from parent.
var NAV_FEATURE_MAP = {
  'attendance':'attendance', 'md-attendance':'attendance', 'hr-attendance':'attendance', 'emp-attendance':'attendance', 'mgr-attendance':'attendance', 'acc-attendance':'attendance',
  'leaves':'leaves', 'md-att-leave':'leaves', 'hr-att-leave':'leaves', 'emp-att-leave':'leaves',
  'advance':'advances', 'md-advance':'advances', 'hr-advance':'advances', 'emp-advance':'advances', 'acc-advance':'advances',
  'expense':'expenses', 'emp-expense':'expenses',
  'salary':'salary', 'md-salary':'salary', 'hr-salary':'salary', 'emp-salary':'salary', 'emp-acc-salary':'salary', 'acc-salary':'salary',
  'tax':'tax', 'md-tax':'tax', 'hr-tax':'tax',
  'progress':'projects', 'md-progress':'projects', 'emp-progress':'projects', 'acc-progress':'projects',
  'tasks':'tasks',
  'md-peb-dash':'peb_stock_items', 'md-inventory':'peb_stock_items', 'hr-inventory':'peb_stock_items', 'emp-store':'peb_stock_items', 'emp-admin-peb':'peb_stock_items',
  'md-procurement':'peb_purchase_indents', 'hr-procurement':'peb_purchase_indents', 'emp-acc-procurement':'peb_purchase_indents', 'acc-procurement':'peb_purchase_indents',
  // Stock Outlet — fulfilling approved material requests (gated on peb_material_requests)
  'md-stock-outlet':'peb_material_requests', 'hr-stock-outlet':'peb_material_requests',
  'md-so-approved':'peb_material_requests', 'hr-so-approved':'peb_material_requests',
  'emp-adm-so-approved':'peb_material_requests', 'mgr-adm-so-approved':'peb_material_requests',
  // Factory Issue Log (gated on peb_stock_items since it deducts stock)
  'md-so-factory':'peb_stock_items', 'hr-so-factory':'peb_stock_items',
  'emp-adm-so-factory':'peb_stock_items', 'mgr-adm-so-factory':'peb_stock_items',
  // MD/HR PEB child nav IDs
  'md-inv-stock':'peb_stock_items', 'md-inv-grn':'peb_grn', 'md-inv-requests':'peb_material_requests', 'md-inv-returns':'peb_returns',
  'md-proc-vendors':'peb_vendors', 'md-proc-indents':'peb_purchase_indents', 'md-proc-orders':'peb_purchase_orders', 'md-proc-transport':'peb_transport',
  // PEB child nav IDs — granular feature gating
  'emp-adm-peb-dash':'peb_stock_items', 'emp-adm-inv-stock':'peb_stock_items', 'emp-adm-inv-grn':'peb_grn',
  'emp-adm-inv-requests':'peb_material_requests', 'emp-adm-inv-returns':'peb_returns',
  'emp-adm-proc-vendors':'peb_vendors', 'emp-adm-proc-indents':'peb_purchase_indents',
  'emp-adm-proc-orders':'peb_purchase_orders', 'emp-adm-proc-transport':'peb_transport',
  'emp-inv-stock':'peb_stock_items', 'emp-inv-requests':'peb_material_requests',
  'emp-inv-returns':'peb_returns', 'emp-proc-transport':'peb_transport',
  'emp-acc-proc-grn':'peb_grn', 'emp-acc-proc-vendors':'peb_vendors',
  'emp-acc-proc-indents':'peb_purchase_indents', 'emp-acc-proc-orders':'peb_purchase_orders',
  'emp-acc-proc-transport':'peb_transport',
  'recruitment':'recruitment', 'hr-recruit':'recruitment',
  'kpi':'kpi', 'md-performance':'kpi', 'hr-performance':'kpi',
  'shifts':'shifts',
  'exit':'exit',
  'compliance':'compliance',
  'documents':'documents',
  'assets':'assets',
  'events':'events',
  'announcements':'announcements',
  'geofence':'geofence',
  'reports':'reports',
  'admin_panel':'admin_panel', 'md-admin':'admin_panel', 'hr-admin':'admin_panel',
  'settings':'settings', 'md-settings':'settings', 'hr-settings':'settings', 'emp-settings':'settings'
};

// Filter nav items by SuperAdmin-managed feature access.
// Items with superAdminOnly:true are only shown for superadmin users.
function filterNavByAccess(items) {
  return items.filter(function(item) {
    // SuperAdmin-only items (e.g. Access Control)
    if (item.superAdminOnly && !_isSuperAdmin && (!currentUser || currentUser.role !== 'MD')) return false;
    // Check feature access
    var featureKey = NAV_FEATURE_MAP[item.id];
    if (featureKey) {
      var access = checkFeatureAccess(featureKey);
      if (!access.allowed) return false;
    }
    // Filter children too
    if (item.children) {
      item = Object.assign({}, item); // shallow copy to avoid mutating config
      item.children = item.children.filter(function(child) {
        var ck = NAV_FEATURE_MAP[child.id];
        if (ck) { var ca = checkFeatureAccess(ck); if (!ca.allowed) return false; }
        return true;
      });
      if (item.children.length === 0) return false; // hide parent if all children filtered
    }
    return true;
  });
}

// PEB Management (emp-admin-peb / mgr-admin-peb) is a comprehensive group covering
// every PEB sub-feature. When it's visible, the dept-specialised Store and Procurement
// groups become redundant duplicates of the same screens — suppress them.
function dedupePebGroups(items) {
  var hasComprehensive = items.some(function(it) {
    return it && (it.id === 'emp-admin-peb' || it.id === 'mgr-admin-peb');
  });
  if (!hasComprehensive) return items;
  var REDUNDANT = { 'emp-store': 1, 'mgr-store': 1, 'emp-acc-procurement': 1 };
  return items.filter(function(it) { return !it || !REDUNDANT[it.id]; });
}

function renderNavigation() {
  if (!currentUser) return;
  var config = dedupePebGroups(filterNavByAccess(filterNavByDept(NAV_CONFIG[currentUser.role] || NAV_CONFIG.Employee)));
  var container = document.getElementById('bottomTabs');
  if (!container) return;
  var isDesktop = window.innerWidth >= 768;
  container.innerHTML = '';
  if (isDesktop) {
    renderDesktopSidebar(config, container);
  } else {
    renderMobileBottomTabs(config, container);
  }
}

function renderMobileBottomTabs(config, container) {
  var mainItems = config.filter(function(i) { return !i.isFooter; });
  var footerItems = config.filter(function(i) { return i.isFooter; });
  var maxVisible = 4; // Reserve 1 slot for "More" button (total 5 tabs)
  var visibleItems = mainItems.slice(0, maxVisible);
  var overflowItems = mainItems.slice(maxVisible);
  // Always add footer items (Profile, Settings, Logout) to overflow for "More" menu
  var allOverflow = overflowItems.concat(footerItems);
  visibleItems.forEach(function(item) {
    var btn = document.createElement('button');
    var isParentActive = _activeNavId === item.id;
    if (!isParentActive && item.children) {
      item.children.forEach(function(c) { if (c.id === _activeNavId) isParentActive = true; });
    }
    btn.className = 'tab-item' + (isParentActive ? ' active' : '');
    btn.setAttribute('data-nav-id', item.id);
    btn.innerHTML = NAV_ICONS[item.icon] + '<span>' + escapeHTML(item.label) + '</span>';
    btn.onclick = function() {
      if (item.children && item.children.length) {
        showMobileSubMenu(item);
      } else {
        _activeNavId = item.id;
        executeNavAction(item, btn);
        updateNavActiveState();
      }
    };
    container.appendChild(btn);
  });
  // Always show "More" button on mobile (footer items are always there)
  if (allOverflow.length > 0) {
    var moreBtn = document.createElement('button');
    moreBtn.className = 'tab-item';
    moreBtn.innerHTML = NAV_ICONS.more + '<span>More</span>';
    moreBtn.onclick = function() { showMobileMoreMenu(allOverflow); };
    container.appendChild(moreBtn);
  }
}

function renderDesktopSidebar(config, container) {
  var mainItems = config.filter(function(i) { return !i.isFooter; });
  var footerItems = config.filter(function(i) { return i.isFooter; });

  var mainDiv = document.createElement('div');
  mainDiv.className = 'sidebar-main';

  mainItems.forEach(function(item) {
    var group = document.createElement('div');
    group.className = 'sidebar-group';

    if (item.children && item.children.length) {
      // Parent with children — expandable
      var isExpanded = !!_navExpandedGroups[item.id];
      var parentBtn = document.createElement('button');
      parentBtn.className = 'tab-item sidebar-parent' + (isExpanded ? ' expanded' : '');
      parentBtn.setAttribute('data-nav-id', item.id);
      parentBtn.innerHTML = NAV_ICONS[item.icon] + '<span>' + escapeHTML(item.label) + '</span>' +
        '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
      parentBtn.onclick = function() { toggleSidebarGroup(item.id); };
      group.appendChild(parentBtn);

      var childrenDiv = document.createElement('div');
      childrenDiv.className = 'sidebar-children' + (isExpanded ? ' expanded' : '');
      childrenDiv.id = 'nav-children-' + item.id;
      item.children.forEach(function(child) {
        var childBtn = document.createElement('button');
        childBtn.className = 'sidebar-child' + (_activeNavId === child.id ? ' active' : '');
        childBtn.setAttribute('data-nav-id', child.id);
        childBtn.innerHTML = '<span class="child-dot"></span><span>' + escapeHTML(child.label) + '</span>';
        childBtn.onclick = function() {
          _activeNavId = child.id;
          executeNavAction(child, childBtn);
          updateNavActiveState();
        };
        childrenDiv.appendChild(childBtn);
      });
      group.appendChild(childrenDiv);
    } else {
      // Leaf item
      var btn = document.createElement('button');
      btn.className = 'tab-item' + (_activeNavId === item.id ? ' active' : '');
      btn.setAttribute('data-nav-id', item.id);
      btn.innerHTML = NAV_ICONS[item.icon] + '<span>' + escapeHTML(item.label) + '</span>';
      btn.onclick = function() {
        _activeNavId = item.id;
        executeNavAction(item, btn);
        updateNavActiveState();
      };
      group.appendChild(btn);
    }
    mainDiv.appendChild(group);
  });
  container.appendChild(mainDiv);

  // Footer
  if (footerItems.length) {
    var footerDiv = document.createElement('div');
    footerDiv.className = 'sidebar-footer';
    footerItems.forEach(function(fi) {
      var fbtn = document.createElement('button');
      fbtn.className = 'sidebar-footer-btn' + (fi.isDanger ? ' logout-btn' : '');
      fbtn.innerHTML = NAV_ICONS[fi.icon] + '<span>' + escapeHTML(fi.label) + '</span>';
      fbtn.onclick = function() { executeNavAction(fi, fbtn); };
      footerDiv.appendChild(fbtn);
    });
    container.appendChild(footerDiv);
  }
}

function executeNavAction(item, btn) {
  if (!item || !item.action) return;
  var a = item.action;
  if (a.type === 'tab') {
    switchTab(a.target, btn);
  } else if (a.type === 'overlay') {
    showOverlay(a.target);
  } else if (a.type === 'logout') {
    confirmLogout();
  }
}

function toggleSidebarGroup(groupId) {
  _navExpandedGroups[groupId] = !_navExpandedGroups[groupId];
  var childrenDiv = document.getElementById('nav-children-' + groupId);
  if (childrenDiv) childrenDiv.classList.toggle('expanded', _navExpandedGroups[groupId]);
  var parentBtn = document.querySelector('[data-nav-id="' + groupId + '"].sidebar-parent');
  if (parentBtn) parentBtn.classList.toggle('expanded', _navExpandedGroups[groupId]);
}

function updateNavActiveState() {
  // Desktop: highlight correct child or parent item
  document.querySelectorAll('#bottomTabs .tab-item, #bottomTabs .sidebar-child').forEach(function(el) {
    var navId = el.getAttribute('data-nav-id');
    if (navId === _activeNavId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  // Mobile: highlight top-level tab matching active child's parent
  if (window.innerWidth < 768 && currentUser) {
    var config = NAV_CONFIG[currentUser.role] || NAV_CONFIG.Employee;
    var parentId = null;
    config.forEach(function(item) {
      if (item.id === _activeNavId) parentId = item.id;
      if (item.children) {
        item.children.forEach(function(c) {
          if (c.id === _activeNavId) parentId = item.id;
        });
      }
    });
    if (parentId) {
      document.querySelectorAll('#bottomTabs .tab-item').forEach(function(el) {
        var navId = el.getAttribute('data-nav-id');
        el.classList.toggle('active', navId === parentId);
      });
    }
  }
}

function showMobileMoreMenu(items) {
  // Remove existing
  var existing = document.querySelector('.more-menu-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'more-menu-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'More navigation options');

  var backdrop = document.createElement('div');
  backdrop.className = 'more-menu-backdrop';
  backdrop.onclick = function() { overlay.remove(); };

  var sheet = document.createElement('div');
  sheet.className = 'more-menu-sheet';

  var title = document.createElement('div');
  title.className = 'more-menu-title';
  title.textContent = 'More';
  sheet.appendChild(title);

  var navItems = items.filter(function(i) { return !i.isFooter; });
  var footerItems = items.filter(function(i) { return i.isFooter; });
  navItems.forEach(function(item) {
    var menuItem = document.createElement('button');
    menuItem.className = 'more-menu-item';
    menuItem.innerHTML = NAV_ICONS[item.icon] + '<span>' + escapeHTML(item.label) + '</span>' +
      (item.children && item.children.length ? '<svg style="margin-left:auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>' : '');
    menuItem.onclick = function() {
      overlay.remove();
      if (item.children && item.children.length) {
        showMobileSubMenu(item);
      } else {
        _activeNavId = item.id;
        executeNavAction(item, null);
        updateNavActiveState();
      }
    };
    sheet.appendChild(menuItem);
  });
  if (footerItems.length > 0) {
    var divider = document.createElement('div');
    divider.className = 'more-menu-divider';
    sheet.appendChild(divider);
    footerItems.forEach(function(item) {
      var menuItem = document.createElement('button');
      menuItem.className = 'more-menu-item' + (item.isDanger ? ' more-menu-danger' : '');
      menuItem.innerHTML = NAV_ICONS[item.icon] + '<span>' + escapeHTML(item.label) + '</span>';
      menuItem.onclick = function() {
        overlay.remove();
        executeNavAction(item, null);
      };
      sheet.appendChild(menuItem);
    });
  }

  overlay.appendChild(backdrop);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  // Close on Escape
  var escHandler = function(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

function showMobileSubMenu(parentItem) {
  var existing = document.querySelector('.more-menu-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'more-menu-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', escapeHTML(parentItem.label));

  var backdrop = document.createElement('div');
  backdrop.className = 'more-menu-backdrop';
  backdrop.onclick = function() { overlay.remove(); };

  var sheet = document.createElement('div');
  sheet.className = 'more-menu-sheet';

  var title = document.createElement('div');
  title.className = 'more-menu-title';
  title.textContent = parentItem.label;
  sheet.appendChild(title);

  parentItem.children.forEach(function(child) {
    var menuItem = document.createElement('button');
    menuItem.className = 'more-menu-item' + (_activeNavId === child.id ? ' active' : '');
    menuItem.innerHTML = '<span class="child-dot" style="width:8px;height:8px;border-radius:50%;background:var(--gray-300);flex-shrink:0"></span><span>' + escapeHTML(child.label) + '</span>';
    menuItem.onclick = function() {
      overlay.remove();
      _activeNavId = child.id;
      executeNavAction(child, null);
      updateNavActiveState();
    };
    sheet.appendChild(menuItem);
  });

  overlay.appendChild(backdrop);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  var escHandler = function(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

function confirmLogout() {
  if (confirm('Log out?')) doLogout();
}

// Re-render nav on crossing 768px breakpoint
(function initNavResize() {
  _lastNavWidth = window.innerWidth;
  window.addEventListener('resize', function() {
    var w = window.innerWidth;
    var wasMobile = _lastNavWidth < 768;
    var isMobile = w < 768;
    if (wasMobile !== isMobile) renderNavigation();
    _lastNavWidth = w;
  });
})();

// =====================================================
// SETTINGS TOGGLE SYNC
// =====================================================
function initSettingsToggles() {
  // Dark mode toggle
  var darkToggle = document.getElementById('darkModeToggle');
  if (darkToggle) {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    darkToggle.classList.toggle('on', isDark);
  }
  // Biometric toggle
  var bioToggle = document.getElementById('biometricToggle');
  if (bioToggle) {
    var bioEnabled = safeStorage.get(STORAGE_KEYS.biometricEnabled) === 'true';
    bioToggle.classList.toggle('on', bioEnabled);
  }
  // Push notifications toggle
  var pushToggle = document.getElementById('pushNotifToggle');
  if (pushToggle) {
    var pushEnabled = safeStorage.get(STORAGE_KEYS.pushNotif) !== 'off';
    pushToggle.classList.toggle('on', pushEnabled);
  }
  // Notification pref toggles (use existing restoreNotifPrefToggles)
  if (typeof restoreNotifPrefToggles === 'function') restoreNotifPrefToggles();
}

function togglePushNotifications(btn) {
  btn.classList.toggle('on');
  var isOn = btn.classList.contains('on');
  safeStorage.set(STORAGE_KEYS.pushNotif, isOn ? 'on' : 'off');
  if (isOn) requestNotificationPermission();
}

function toggleBiometricSetting(btn) {
  var isCurrentlyOn = btn.classList.contains('on');
  if (isCurrentlyOn) {
    btn.classList.remove('on');
    safeStorage.set(STORAGE_KEYS.biometricEnabled, 'false');
    showToast('Biometric login disabled');
  } else {
    registerBiometric().then(function() {
      // registerBiometric sets the storage key on success
      var enabled = safeStorage.get(STORAGE_KEYS.biometricEnabled) === 'true';
      btn.classList.toggle('on', enabled);
    });
  }
}

// =====================================================
// DARK MODE
// =====================================================
function initDarkMode() {
  const saved = safeStorage.get(STORAGE_KEYS.darkMode);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved !== null ? saved === 'true' : prefersDark;
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('meta[name="theme-color"]').content = '#0F1117';
  }
  const toggle = document.getElementById('darkModeToggle');
  if (toggle && isDark) toggle.classList.add('on');
}
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const toggle = document.getElementById('darkModeToggle');
  if (isDark) {
    html.removeAttribute('data-theme');
    document.querySelector('meta[name="theme-color"]').content = '#E85D04';
    safeStorage.set(STORAGE_KEYS.darkMode, 'false');
    if (toggle) toggle.classList.remove('on');
  } else {
    html.setAttribute('data-theme', 'dark');
    document.querySelector('meta[name="theme-color"]').content = '#0F1117';
    safeStorage.set(STORAGE_KEYS.darkMode, 'true');
    if (toggle) toggle.classList.add('on');
  }
  // Re-render charts if analytics overlay is visible
  var analyticsEl = document.getElementById('hr-analytics');
  if (analyticsEl && analyticsEl.classList.contains('show')) {
    renderAnalyticsOverlay();
  }
}

// =====================================================
// RIPPLE EFFECT ON BUTTONS
// =====================================================
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const existing = btn.querySelector('.ripple-effect');
  if (existing) existing.remove();
  const circle = document.createElement('span');
  circle.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.width = circle.style.height = size + 'px';
  circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
  circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(circle);
  circle.addEventListener('animationend', () => circle.remove(), { once: true });
});

// =====================================================
// FEATURE 1: PAYROLL PDF REPORT
// =====================================================
async function downloadPayrollReport() {
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape
  const pw = 297, ph = 210, lm = 10, rm = 287, cw = rm - lm;
  const primary = [76,81,191], dark = [30,30,60], mid = [100,100,120], light = [245,245,252], border = [200,200,220];
  const fmt = v => 'Rs.' + v.toLocaleString('en-IN');
  const fm = FY_MONTHS[activeSalaryMonth];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mName = monthNames[fm.mi];

  function drawHeader(y) {
    try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 25, 9); } catch(e) {
      doc.setFillColor(99,102,241); doc.roundedRect(lm, y, 25, 9, 2, 2, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255); doc.text('SS', lm+1.5, y+6.5);
    }
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...primary); doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm+28, y+4);
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...mid); doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035 | GSTIN: 33AAWCS9286M1Z6', lm+28, y+8);
    doc.setDrawColor(...primary); doc.setLineWidth(0.5); doc.line(lm, y+12, rm, y+12);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    doc.text('PAYROLL REPORT — ' + mName + ' ' + fm.y, pw/2, y+18, {align:'center'});
    return y + 22;
  }

  function drawTableHeader(y) {
    const cols = ['Name','Code','Dept','Basic','HRA','DA','Other','Special','Gross','PF','ESI','Tax','Net'];
    const widths = [38,18,20,22,20,18,18,20,24,18,16,16,26];
    doc.setFillColor(...primary); doc.rect(lm, y, cw, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(255,255,255);
    let x = lm + 1;
    cols.forEach((c,i) => { doc.text(c, x, y+5); x += widths[i]; });
    return y + 7;
  }

  let y = drawHeader(8);
  y = drawTableHeader(y + 2);
  const widths = [38,18,20,22,20,18,18,20,24,18,16,16,26];
  const depts = {};
  EMPLOYEES.forEach(emp => { if(!depts[emp.dept]) depts[emp.dept]=[]; depts[emp.dept].push(emp); });
  let grandTotal = {gross:0,pf:0,esi:0,tax:0,net:0};
  let rowIdx = 0;

  for (const dept of Object.keys(depts).sort()) {
    let deptTotal = {gross:0,pf:0,esi:0,tax:0,net:0};
    depts[dept].forEach(emp => {
      if (y > 185) { doc.addPage(); y = drawHeader(8); y = drawTableHeader(y+2); rowIdx = 0; }
      const s = generateMonthlySalary(emp, fm.mi, fm.y);
      if (rowIdx % 2 === 0) { doc.setFillColor(...light); doc.rect(lm, y, cw, 6, 'F'); }
      doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...dark);
      let x = lm + 1;
      const vals = [emp.name.substring(0,20), emp.code, emp.dept, fmt(s.basic), fmt(s.hra), fmt(s.da), fmt(s.otherAllow), fmt(s.specialAllow), fmt(s.gross), fmt(s.pf), fmt(s.esi), fmt(s.profTax), fmt(s.net)];
      vals.forEach((v,i) => { doc.text(v, x, y+4); x += widths[i]; });
      deptTotal.gross+=s.gross; deptTotal.pf+=s.pf; deptTotal.esi+=s.esi; deptTotal.tax+=s.profTax; deptTotal.net+=s.net;
      y += 6; rowIdx++;
    });
    // Dept subtotal
    if (y > 185) { doc.addPage(); y = drawHeader(8); y = drawTableHeader(y+2); rowIdx = 0; }
    doc.setFillColor(230,230,245); doc.rect(lm, y, cw, 6, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.setTextColor(...primary);
    doc.text(dept + ' Subtotal (' + depts[dept].length + ' staff)', lm+1, y+4);
    let x = lm+1; for(let i=0;i<8;i++) x+=widths[i];
    doc.text(fmt(deptTotal.gross), x, y+4); x+=widths[8]; doc.text(fmt(deptTotal.pf), x, y+4); x+=widths[9];
    doc.text(fmt(deptTotal.esi), x, y+4); x+=widths[10]; doc.text(fmt(deptTotal.tax), x, y+4); x+=widths[11]; doc.text(fmt(deptTotal.net), x, y+4);
    grandTotal.gross+=deptTotal.gross; grandTotal.pf+=deptTotal.pf; grandTotal.esi+=deptTotal.esi; grandTotal.tax+=deptTotal.tax; grandTotal.net+=deptTotal.net;
    y += 8; rowIdx++;
  }
  // Grand total
  if (y > 185) { doc.addPage(); y = drawHeader(8); y = drawTableHeader(y+2); }
  doc.setFillColor(...primary); doc.rect(lm, y, cw, 7, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(255,255,255);
  doc.text('GRAND TOTAL (' + EMPLOYEES.length + ' employees)', lm+1, y+5);
  let x = lm+1; for(let i=0;i<8;i++) x+=widths[i];
  doc.text(fmt(grandTotal.gross), x, y+5); x+=widths[8]; doc.text(fmt(grandTotal.pf), x, y+5); x+=widths[9];
  doc.text(fmt(grandTotal.esi), x, y+5); x+=widths[10]; doc.text(fmt(grandTotal.tax), x, y+5); x+=widths[11]; doc.text(fmt(grandTotal.net), x, y+5);

  doc.save('Payroll_Report_' + fm.m + '_' + fm.y + '.pdf');
  showToast('Payroll report downloaded');
  addNotification('Payroll Report Generated', fm.m + ' ' + fm.y + ' payroll report downloaded', 'payroll');
}

// =====================================================
// FEATURE 2: ATTENDANCE REPORT PDF
// =====================================================
async function downloadAttendanceReport() {
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, lm = 15, rm = 195, cw = rm - lm;
  const primary = [76,81,191], dark = [30,30,60], mid = [100,100,120], light = [245,245,252];
  const now = new Date();
  const mName = now.toLocaleString('en-US',{month:'long'});
  const yr = now.getFullYear();
  const daysInMonth = new Date(yr, now.getMonth()+1, 0).getDate();
  const workingDays = daysInMonth - 4; // ~4 holidays

  // Header
  let y = 15;
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 30, 11); } catch(e) {
    doc.setFillColor(99,102,241); doc.roundedRect(lm, y, 30, 11, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text('SS', lm+2.5, y+7.8);
  }
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...primary); doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm+33, y+5);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...mid); doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035 | GSTIN: 33AAWCS9286M1Z6', lm+33, y+10);
  y += 18; doc.setDrawColor(...primary); doc.setLineWidth(0.6); doc.line(lm, y, rm, y);
  y += 8; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...dark);
  doc.text('ATTENDANCE REPORT — ' + mName + ' ' + yr, pw/2, y, {align:'center'});
  y += 8;

  // Summary — build from attendanceLogs DB data
  let totalPresent = 0, totalCount = EMPLOYEES.length;
  const curMonth = now.getMonth(), curYear = yr;
  const empData = EMPLOYEES.map(emp => {
    const empLogs = attendanceLogs.filter(function(l) {
      var d = new Date(l.date || l.check_in);
      return (l.empCode || l.emp_code) === emp.code && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
    const present = empLogs.filter(function(l) { return l.status === 'present' || l.status === 'Present' || l.check_in; }).length;
    const half = empLogs.filter(function(l) { return l.status === 'half' || l.status === 'Half Day'; }).length;
    const absent = empLogs.filter(function(l) { return l.status === 'absent' || l.status === 'Absent'; }).length;
    const leave = empLogs.filter(function(l) { return l.status === 'leave' || l.status === 'Leave'; }).length;
    const holiday = daysInMonth - workingDays;
    const pct = workingDays > 0 ? Math.round((present + half * 0.5) / workingDays * 100) : 0;
    totalPresent += pct;
    return { emp, present, absent, half, leave, holiday, pct };
  });
  const avgAtt = totalCount > 0 ? Math.round(totalPresent / totalCount) : 0;

  doc.setFillColor(...light); doc.roundedRect(lm, y, cw, 16, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...primary);
  doc.text('Total Employees: ' + totalCount, lm+5, y+6);
  doc.text('Avg Attendance: ' + avgAtt + '%', lm+65, y+6);
  doc.text('Working Days: ' + workingDays, lm+130, y+6);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...mid);
  doc.text('Holidays: ' + (daysInMonth - workingDays), lm+5, y+12);
  y += 20;

  // Table header
  function drawAttHeader(y) {
    const cols = ['Name','Code','Dept','Present','Absent','Half','Leave','Holiday','% Att'];
    const widths = [40,20,22,18,16,16,16,18,18];
    doc.setFillColor(...primary); doc.rect(lm, y, cw, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255);
    let x = lm+1; cols.forEach((c,i) => { doc.text(c, x, y+5); x += widths[i]; });
    return y + 7;
  }

  y = drawAttHeader(y);
  const widths = [40,20,22,18,16,16,16,18,18];
  const depts = {};
  empData.forEach(d => { if(!depts[d.emp.dept]) depts[d.emp.dept]=[]; depts[d.emp.dept].push(d); });

  let rowIdx = 0;
  for (const dept of Object.keys(depts).sort()) {
    depts[dept].forEach(d => {
      if (y > 270) { doc.addPage(); y = 15; y = drawAttHeader(y); rowIdx = 0; }
      if (rowIdx % 2 === 0) { doc.setFillColor(...light); doc.rect(lm, y, cw, 6, 'F'); }
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...dark);
      let x = lm+1;
      [d.emp.name.substring(0,22), d.emp.code, d.emp.dept, String(d.present), String(d.absent), String(d.half), String(d.leave), String(d.holiday), d.pct+'%'].forEach((v,i) => { doc.text(v, x, y+4); x += widths[i]; });
      y += 6; rowIdx++;
    });
  }

  doc.save('Attendance_Report_' + mName + '_' + yr + '.pdf');
  showToast('Attendance report downloaded');
}

// =====================================================
// FEATURE 3: EMPLOYEE ID CARD PDF
// =====================================================
async function downloadIDCard() {
  if (!currentUser) { showToast('Not logged in'); return; }
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', [105, 74]); // credit card size
  const w = 105, h = 74;
  const primary = [76,81,191], pLight = [99,102,241];

  // Top strip
  doc.setFillColor(...pLight); doc.rect(0, 0, w, 18, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
  doc.text('SWETHA STRUCTURES PVT LTD', 26, 8);
  doc.setFont('helvetica','normal'); doc.setFontSize(5);
  doc.text('EMPLOYEE IDENTITY CARD', 26, 13);
  // Logo
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', 2, 2, 22, 8); } catch(e) {
    doc.setFillColor(255,255,255); doc.roundedRect(2, 2, 22, 8, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...primary); doc.text('SS', 4.5, 9.5);
  }

  // Initials circle
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  doc.setFillColor(...primary);
  doc.circle(18, 32, 8, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255);
  doc.text(initials, 18, 35, {align:'center'});

  // Employee details
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,60);
  doc.text(currentUser.name, 30, 28);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(100,100,120);
  doc.text(currentUser.designation || currentUser.dept, 30, 33);
  doc.setFontSize(6);
  doc.text('Code: ' + currentUser.code, 30, 38);
  doc.text('Dept: ' + currentUser.dept, 30, 42);
  const doj = new Date(currentUser.doj || '2020-01-01').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  doc.text('DOJ: ' + doj, 30, 46);
  doc.text('Phone: ' + (currentUser.phone || 'N/A'), 30, 50);

  // Bottom
  doc.setDrawColor(200,200,220); doc.setLineWidth(0.3); doc.line(3, 56, w-3, 56);
  doc.setFont('helvetica','normal'); doc.setFontSize(5); doc.setTextColor(150,150,170);
  doc.text('Swetha Structures Pvt Ltd | No.44, Alagu Nagar, Saravanampatti, Coimbatore 641035', w/2, 62, {align:'center'});
  doc.text('If found, please return to the above address', w/2, 66, {align:'center'});

  // Border
  doc.setDrawColor(...primary); doc.setLineWidth(0.8); doc.roundedRect(1, 1, w-2, h-2, 3, 3, 'S');

  const safeName = currentUser.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save('IDCard_' + safeName + '_' + currentUser.code + '.pdf');
  showToast('ID Card downloaded');
}

// =====================================================
// FEATURE 5: PUSH NOTIFICATIONS EXPANSION
// =====================================================
function addNotification(title, body, category) {
  NOTIF_HISTORY.unshift({ id: Date.now(), title, body, category, time: new Date().toISOString(), read: false });
  if (NOTIF_HISTORY.length > 50) NOTIF_HISTORY.length = 50;
  updateNotifBadge();
  // Fire browser notification + in-app popup if pref allows
  if (notifPrefs[category] !== false) {
    sendNotification(title, body, category + '-' + Date.now());
    showNotifPopup(title, body);
  }
  // notifHistory saved to DB via API
  // Persist to backend (include target_emp_code for person-specific notifications)
  apiCall('POST', '/notifications', { title, body, category, target_emp_code: currentUser ? currentUser.code : null }).catch(function(){});
}

// Refresh notifications from backend (picks up notifications created server-side for this user)
var _notifPollTimer = null;
function showNotifPopup(title, body) {
  var existing = document.querySelector('.notif-popup');
  if (existing) existing.remove();
  var popup = document.createElement('div');
  popup.className = 'notif-popup';
  popup.innerHTML = '<div class="notif-popup-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><div class="notif-popup-text"><div class="notif-popup-title">' + escapeHTML(title) + '</div><div class="notif-popup-body">' + escapeHTML(body) + '</div></div><button class="notif-popup-close" onclick="this.parentElement.remove()">&times;</button>';
  document.body.appendChild(popup);
  requestAnimationFrame(function() { popup.classList.add('show'); });
  setTimeout(function() { if (popup.parentElement) { popup.classList.remove('show'); setTimeout(function() { if (popup.parentElement) popup.remove(); }, 300); } }, 6000);
}

function refreshNotifications() {
  apiCall('GET', '/notifications').then(function(data) {
    if (!data || !Array.isArray(data)) return;
    var hadUnread = NOTIF_HISTORY.filter(function(n) { return !n.read; }).length;
    NOTIF_HISTORY.length = 0;
    data.map(mapNotification).forEach(function(n) { NOTIF_HISTORY.push(n); });
    var nowUnread = NOTIF_HISTORY.filter(function(n) { return !n.read; }).length;
    updateNotifBadge();
    // In-app popup + browser notification for newly arrived notifications
    if (nowUnread > hadUnread) {
      var newest = NOTIF_HISTORY.find(function(n) { return !n.read; });
      if (newest && notifPrefs[newest.category] !== false) {
        sendNotification(newest.title, newest.body, newest.category + '-' + newest.id);
        showNotifPopup(newest.title, newest.body);
      }
    }
    // notifHistory saved to DB via API
    // If notification overlay is open, re-render it
    var overlay = document.getElementById('overlay-notifications');
    if (overlay && overlay.classList.contains('active')) renderNotifications();
  }).catch(function(){});
}
function startNotifPoll() {
  stopNotifPoll();
  refreshNotifications();
  // Use WebSocket if available, fallback to polling at longer interval
  if (window._hrmsSocket && window._hrmsSocket.connected) {
    _notifPollTimer = setInterval(refreshNotifications, 30000); // 30s fallback only
  } else {
    _notifPollTimer = setInterval(refreshNotifications, 5000);
  }
}
function stopNotifPoll() {
  if (_notifPollTimer) { clearInterval(_notifPollTimer); _notifPollTimer = null; }
}

// =====================================================
// WEBSOCKET — Real-time updates via Socket.io
// =====================================================
var _hrmsSocket = null;

function initWebSocket() {
  try {
  if (!window.io || !currentUser) return;
  if (_hrmsSocket) _hrmsSocket.disconnect();

  _hrmsSocket = io({ auth: { token: JWT_TOKEN } });
  window._hrmsSocket = _hrmsSocket;

  // Authenticate with server (JWT verified on handshake)
  _hrmsSocket.on('connect', function() {
    console.log('[WS] Connected (JWT authenticated)');
    // Switch polling to longer interval since we have real-time
    stopNotifPoll();
    _notifPollTimer = setInterval(refreshNotifications, 30000);
  });

  _hrmsSocket.on('disconnect', function() {
    console.log('[WS] Disconnected — falling back to polling');
    stopNotifPoll();
    _notifPollTimer = setInterval(refreshNotifications, 5000);
  });

  // ── Real-time notification ──
  _hrmsSocket.on('notification', function(data) {
    NOTIF_HISTORY.unshift({ id: data.id, title: data.title, body: data.body, category: data.category, read: false, date: data.time || new Date().toISOString() });
    updateNotifBadge();
    showNotifPopup(data.title, data.body);
    sendNotification(data.title, data.body, data.category + '-' + data.id);
    var overlay = document.getElementById('overlay-notifications');
    if (overlay && overlay.classList.contains('active')) renderNotifications();
  });

  // ── Attendance: someone checked in ──
  _hrmsSocket.on('attendance:checkin', function(data) {
    showToast(data.name + ' checked in at ' + data.location, 'info');
    if (typeof renderLiveLocationCards === 'function') renderLiveLocationCards();
    renderRecentActivity(); // Instant home update
  });

  // ── Attendance: someone checked out ──
  _hrmsSocket.on('attendance:checkout', function(data) {
    showToast(data.name + ' checked out', 'info');
    if (typeof renderLiveLocationCards === 'function') renderLiveLocationCards();
    renderRecentActivity(); // Instant home update
  });

  // ── Leave: new request submitted ──
  _hrmsSocket.on('leave:new', function(data) {
    showToast(data.empName + ' applied for ' + data.days + ' day(s) ' + data.type + ' leave', 'info');
    renderRecentActivity();
    renderHomeQuickStats();
    if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
  });

  // Helper: keep the local leaveApplications array in sync with status changes
  // received over the socket. Without this, getCasualLeavesUsedThisMonth() and
  // the permission badge will keep showing the request as still pending/used
  // even after the server updated it.
  function _patchLocalLeaveStatus(id, newStatus) {
    if (typeof leaveApplications === 'undefined' || !id) return;
    var app = leaveApplications.find(function(a) { return a.id === id; });
    if (app) app.status = newStatus;
  }
  // Helper: re-fetch leave balance after server-side change, so the displayed
  // remaining count matches the DB (esp. for permission which is server-authoritative).
  async function _refreshLeaveBalance() {
    try {
      if (!currentUser) return;
      var role = currentUser.role;
      if (role === 'MD' || role === 'HR') {
        var all = await apiCall('GET', '/leaves/balance/all');
        if (all && typeof all === 'object') {
          Object.keys(leaveBalances).forEach(function(k) { delete leaveBalances[k]; });
          Object.assign(leaveBalances, all);
        }
      } else {
        var mine = await apiCall('GET', '/leaves/balance');
        if (mine) leaveBalances[currentUser.code] = mine;
      }
    } catch (e) { /* non-fatal — UI will recover on next render */ }
  }

  // ── Leave: approved ──
  _hrmsSocket.on('leave:approved', function(data) {
    _patchLocalLeaveStatus(data && data.id, 'approved');
    showToast('Your ' + data.type + ' leave (' + data.days + ' days) has been approved!', 'success');
    showNotifPopup('Leave Approved', 'Your ' + data.type + ' leave has been approved');
    refreshNotifications();
    _refreshLeaveBalance().then(function() {
      if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
    });
    renderRecentActivity();
    renderHomeQuickStats();
  });

  // ── Leave: HR accepted ──
  _hrmsSocket.on('leave:hr_accepted', function(data) {
    _patchLocalLeaveStatus(data && data.id, 'hr_accepted');
    showToast('Your ' + data.type + ' leave has been accepted by HR, awaiting MD approval', 'info');
    refreshNotifications();
    if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
    renderRecentActivity();
  });

  // ── Leave: rejected ──
  // IMPORTANT: server does NOT decrement balance on reject (leaves.js:204-207),
  // so we must NOT decrement locally either. Just mark the local app as rejected
  // and refresh the balance from server so any stale optimistic decrement is
  // reverted, restoring the count to what it was before the request.
  _hrmsSocket.on('leave:rejected', function(data) {
    _patchLocalLeaveStatus(data && data.id, 'rejected');
    showToast('Your ' + data.type + ' leave has been rejected', 'error');
    showNotifPopup('Leave Rejected', 'Your ' + data.type + ' leave was rejected');
    refreshNotifications();
    _refreshLeaveBalance().then(function() {
      if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
    });
    renderRecentActivity();
  });

  // ── Leave: pending for MD ──
  _hrmsSocket.on('leave:pending_approval', function(data) {
    showToast(data.empName + ' has a leave pending your approval', 'info');
    refreshNotifications();
    if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
    renderRecentActivity();
    renderHomeQuickStats();
  });

  // ── Leave: any update (for MD/HR dashboard refresh) ──
  // Server emits { id, empCode, status } so we can sync local state directly,
  // avoiding stale "used this month" counts on the team view after a reject.
  _hrmsSocket.on('leave:updated', function(data) {
    if (data && data.id && data.status) _patchLocalLeaveStatus(data.id, data.status);
    _refreshLeaveBalance().then(function() {
      if (typeof renderLeaveScreen === 'function') renderLeaveScreen();
    });
    renderRecentActivity();
  });

  // ── Advance request submitted ──
  _hrmsSocket.on('advance:new', function(data) {
    showToast(data.empName + ' submitted ' + data.type + ' advance for Rs.' + Number(data.amount).toLocaleString('en-IN'), 'info');
    refreshNotifications();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    renderRecentActivity();
    renderHomeQuickStats();
  });

  // ── Advance: HR accepted ──
  _hrmsSocket.on('advance:hr_accepted', function(data) {
    var adv = advanceRequests.find(function(a) { return a.id === data.id; });
    if (adv) adv.status = 'hr_accepted';
    showToast('Your ' + (data.type || '') + ' advance has been accepted by HR', 'success');
    refreshNotifications();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllMyRequests();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Advance: pending MD approval ──
  _hrmsSocket.on('advance:pending_approval', function(data) {
    showToast(data.empName + ' advance pending your approval', 'info');
    refreshNotifications();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Advance: approved ──
  _hrmsSocket.on('advance:approved', function(data) {
    var adv = advanceRequests.find(function(a) { return a.id === data.id; });
    if (adv) adv.status = 'approved';
    showToast('Your ' + (data.type || '') + ' advance has been approved!', 'success');
    refreshNotifications();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllMyRequests();
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Advance: rejected ──
  _hrmsSocket.on('advance:rejected', function(data) {
    var adv = advanceRequests.find(function(a) { return a.id === data.id; });
    if (adv) { adv.status = 'rejected'; adv.rejectReason = data.reason || ''; }
    showToast('Your ' + (data.type || '') + ' advance was rejected' + (data.reason ? ': ' + data.reason : ''), 'error');
    refreshNotifications();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllMyRequests();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Advance: general update (for MD/HR dashboard) ──
  _hrmsSocket.on('advance:updated', function(data) {
    // Re-fetch advances from server to stay in sync
    apiCall('GET', '/advances?limit=100').then(function(resp) {
      var rows = resp && resp.data ? resp.data : [];
      rows.forEach(function(r) {
        r.empCode = r.emp_code || r.empCode;
        r.empName = r.emp_name || r.empName;
        r.appliedDate = r.applied_date || r.appliedDate;
        r.reviewedBy = r.reviewed_by || r.reviewedBy;
        r.reviewDate = r.review_date || r.reviewDate;
        r.rejectReason = r.reject_reason || r.rejectReason;
        r.travelFrom = r.travel_from || r.travelFrom;
        r.travelTo = r.travel_to || r.travelTo;
        r.travelKm = r.travel_km || r.travelKm;
        r.emiAmount = r.emi_amount || r.emiAmount;
        r.emiMonths = r.emi_months || r.emiMonths;
        var idx = advanceRequests.findIndex(function(a) { return a.id === r.id; });
        if (idx >= 0) Object.assign(advanceRequests[idx], r);
        else advanceRequests.push(r);
      });
    }).catch(function() {});
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    renderRecentActivity();
  });

  // ── Expense: new submission ──
  _hrmsSocket.on('expense:new', function(data) {
    showToast(data.empName + ' submitted ' + data.category + ' expense for Rs.' + Number(data.amount).toLocaleString('en-IN'), 'info');
    refreshNotifications();
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Expense: HR accepted ──
  _hrmsSocket.on('expense:hr_accepted', function(data) {
    var exp = expenseReimbursements.find(function(e) { return e.id === data.id; });
    if (exp) exp.status = 'hr_accepted';
    showToast('Your ' + (data.category || '') + ' expense has been accepted by HR', 'success');
    refreshNotifications();
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    if (typeof renderExpenseOverlay === 'function') renderExpenseOverlay();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Expense: approved ──
  _hrmsSocket.on('expense:approved', function(data) {
    var exp = expenseReimbursements.find(function(e) { return e.id === data.id; });
    if (exp) exp.status = 'Approved';
    showToast('Your ' + (data.category || '') + ' expense has been approved!', 'success');
    refreshNotifications();
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    if (typeof renderExpenseOverlay === 'function') renderExpenseOverlay();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Expense: rejected ──
  _hrmsSocket.on('expense:rejected', function(data) {
    var exp = expenseReimbursements.find(function(e) { return e.id === data.id; });
    if (exp) exp.status = 'Rejected';
    showToast('Your ' + (data.category || '') + ' expense was rejected', 'error');
    refreshNotifications();
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    if (typeof renderExpenseOverlay === 'function') renderExpenseOverlay();
    renderAllPendingBanners();
    renderHomeQuickStats();
  });

  // ── Expense: general update (for MD/HR dashboard) ──
  _hrmsSocket.on('expense:updated', function(data) {
    // Re-fetch expenses from server to stay in sync
    apiCall('GET', '/expenses?limit=100').then(function(resp) {
      var rows = resp && resp.data ? resp.data : [];
      rows.forEach(function(r) {
        r.empCode = r.emp_code || r.empCode;
        r.empName = r.emp_name || r.empName;
        r.expenseType = r.expense_type || r.expenseType;
        r.billUrl = r.bill_url || r.billUrl;
        var idx = expenseReimbursements.findIndex(function(e) { return e.id === r.id; });
        if (idx >= 0) Object.assign(expenseReimbursements[idx], r);
        else expenseReimbursements.push(r);
      });
    }).catch(function() {});
    if (typeof renderSiteExpenseScreen === 'function') renderSiteExpenseScreen();
    if (typeof renderTravelExpenseScreen === 'function') renderTravelExpenseScreen();
    if (typeof renderExpenseOverlay === 'function') renderExpenseOverlay();
    if (typeof renderAdvanceRequests === 'function') renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
    renderRecentActivity();
  });

  // ── Missed Attendance ──
  _hrmsSocket.on('missed-attendance:new', function(data) {
    showToast(data.name + ' submitted a missed attendance request for ' + data.date, 'info');
    refreshNotifications();
    loadMissedAttRequests();
    renderHomeQuickStats();
  });
  _hrmsSocket.on('missed-attendance:approved', function(data) {
    showToast('Your missed attendance for ' + data.date + ' has been approved!', 'success');
    refreshNotifications();
    loadMissedAttRequests();
    buildCalendar();
  });
  _hrmsSocket.on('missed-attendance:rejected', function(data) {
    showToast('Your missed attendance request for ' + data.date + ' was rejected', 'error');
    refreshNotifications();
    loadMissedAttRequests();
  });

  // ── Announcements ──
  _hrmsSocket.on('announcement:created', function(data) {
    showToast('New announcement: ' + (data.title || ''), 'info');
    showNotifPopup('New Announcement', data.title || '');
    refreshNotifications();
    apiCall('GET', '/announcements?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      if (typeof announcements !== 'undefined') { announcements.length = 0; list.forEach(function(a) { announcements.push(a); }); }
    }).catch(function() {});
  });
  _hrmsSocket.on('announcement:deleted', function() {
    apiCall('GET', '/announcements?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      if (typeof announcements !== 'undefined') { announcements.length = 0; list.forEach(function(a) { announcements.push(a); }); }
    }).catch(function() {});
  });

  // ── Tasks ──
  _hrmsSocket.on('task:created', function(data) {
    if (data.assignedTo === currentUser.code || data.assignedTo === currentUser.dept || data.assignedTo === 'ALL') {
      showToast('New task assigned: ' + (data.title || ''), 'info');
    } else if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      showToast('New task created: ' + (data.title || ''), 'info');
    }
    apiCall('GET', '/tasks?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      TASK_DATA.length = 0; list.forEach(function(t) { TASK_DATA.push(t); });
      renderHomeTasks();
    }).catch(function() {});
  });
  _hrmsSocket.on('task:updated', function() {
    apiCall('GET', '/tasks?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      TASK_DATA.length = 0; list.forEach(function(t) { TASK_DATA.push(t); });
      renderHomeTasks();
    }).catch(function() {});
  });
  _hrmsSocket.on('task:toggled', function() {
    apiCall('GET', '/tasks?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      TASK_DATA.length = 0; list.forEach(function(t) { TASK_DATA.push(t); });
      renderHomeTasks();
    }).catch(function() {});
  });
  _hrmsSocket.on('task:deleted', function() {
    apiCall('GET', '/tasks?limit=200').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      TASK_DATA.length = 0; list.forEach(function(t) { TASK_DATA.push(t); });
      renderHomeTasks();
    }).catch(function() {});
  });

  // ── Shifts ──
  _hrmsSocket.on('shift:assigned', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('Your shift has been updated to: ' + (data.shiftCode || ''), 'info');
    }
  });
  _hrmsSocket.on('shiftType:created', function() { showToast('New shift type added', 'info'); });
  _hrmsSocket.on('shiftType:updated', function() { showToast('Shift type updated', 'info'); });

  // ── Assets ──
  _hrmsSocket.on('asset:created', function(data) {
    showToast('New asset added: ' + (data.name || ''), 'info');
  });
  _hrmsSocket.on('asset:assigned', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('An asset has been assigned to you: ' + (data.assetName || ''), 'info');
      showNotifPopup('Asset Assigned', 'You have been assigned: ' + (data.assetName || ''));
    }
  });
  _hrmsSocket.on('asset:returned', function(data) {
    if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      showToast('Asset returned: ' + (data.assetName || ''), 'info');
    }
  });

  // ── Recruitment ──
  _hrmsSocket.on('job:created', function(data) {
    showToast('New job posted: ' + (data.title || ''), 'info');
  });
  _hrmsSocket.on('job:updated', function() { /* silent refresh */ });
  _hrmsSocket.on('candidate:created', function(data) {
    showToast('New candidate added: ' + (data.name || ''), 'info');
  });
  _hrmsSocket.on('candidate:moved', function(data) {
    showToast('Candidate ' + (data.name || '') + ' moved to ' + (data.stage || ''), 'info');
  });

  // ── Projects ──
  _hrmsSocket.on('project:created', function(data) {
    showToast('New project created: ' + (data.name || ''), 'info');
    apiCall('GET', '/projects').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      projects.length = 0; list.map(mapProject).forEach(function(p) { projects.push(p); });
    }).catch(function() {});
  });
  _hrmsSocket.on('project:updated', function() {
    apiCall('GET', '/projects').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      projects.length = 0; list.map(mapProject).forEach(function(p) { projects.push(p); });
    }).catch(function() {});
  });
  _hrmsSocket.on('project:deleted', function() {
    apiCall('GET', '/projects').then(function(resp) {
      var list = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);
      projects.length = 0; list.map(mapProject).forEach(function(p) { projects.push(p); });
    }).catch(function() {});
  });
  _hrmsSocket.on('projectTask:created', function(data) {
    if (data.assignedTo === currentUser.code) {
      showToast('You have been assigned a project task: ' + (data.title || ''), 'info');
    }
  });
  _hrmsSocket.on('projectTask:updated', function() { /* silent */ });
  _hrmsSocket.on('projectTeam:added', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('You have been added to a project', 'info');
    }
  });
  _hrmsSocket.on('projectTeam:removed', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('You have been removed from a project', 'info');
    }
  });

  // ── KPI ──
  _hrmsSocket.on('kpi:selfRated', function(data) {
    if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      showToast((data.empName || data.empCode) + ' submitted self-rating', 'info');
    }
  });
  _hrmsSocket.on('kpi:scoresUpdated', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('Your KPI scores have been updated', 'info');
    }
  });

  // ── Salary updated ──
  _hrmsSocket.on('salary:updated', function(data) {
    // Update local EMPLOYEES array
    var emp = EMPLOYEES.find(function(e) { return e.code === data.empCode; });
    if (emp) emp.salary = data.salary;
    if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      showToast('Salary updated for ' + (data.empName || data.empCode) + ': Rs.' + Number(data.salary).toLocaleString('en-IN'), 'info');
    }
  });

  // ── Documents ──
  _hrmsSocket.on('document:uploaded', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('A document has been uploaded for you', 'info');
    } else if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      showToast((data.empName || data.empCode) + ' uploaded a document', 'info');
    }
  });
  _hrmsSocket.on('document:deleted', function() { /* silent */ });

  // ── Exit ──
  _hrmsSocket.on('exit:requested', function(data) {
    showToast((data.empName || data.empCode) + ' submitted an exit request', 'info');
    showNotifPopup('Exit Request', (data.empName || '') + ' has requested to exit');
    refreshNotifications();
  });
  _hrmsSocket.on('exit:approved', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('Your exit request has been approved', 'success');
      showNotifPopup('Exit Approved', 'Your exit request has been approved');
    }
    refreshNotifications();
  });
  _hrmsSocket.on('exit:rejected', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('Your exit request has been rejected', 'error');
    }
    refreshNotifications();
  });
  _hrmsSocket.on('exit:completed', function(data) {
    if (data.empCode === currentUser.code) {
      showToast('Your exit process has been completed', 'info');
    }
    refreshNotifications();
  });

  // ── Compliance ──
  _hrmsSocket.on('filing:created', function(data) {
    showToast('New compliance filing: ' + (data.type || ''), 'info');
  });
  _hrmsSocket.on('filing:marked', function() { showToast('Compliance filing marked as done', 'info'); });
  _hrmsSocket.on('contractWorker:created', function(data) {
    showToast('New contract worker added: ' + (data.name || ''), 'info');
  });

  // ── User online/offline (for MD live tracking) ──
  _hrmsSocket.on('user:online', function(data) {
    if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      console.log('[WS] ' + data.empCode + ' came online');
    }
  });

  _hrmsSocket.on('user:offline', function(data) {
    if (currentUser.role === 'MD' || currentUser.role === 'HR') {
      console.log('[WS] ' + data.empCode + ' went offline');
    }
  });
  } catch(e) { console.error('[WS] Init error:', e); }
}

function disconnectWebSocket() {
  if (_hrmsSocket) { _hrmsSocket.disconnect(); _hrmsSocket = null; window._hrmsSocket = null; }
}

// =====================================================
// PWA: OFFLINE SYNC + BACKGROUND SYNC
// =====================================================
// Listen for SW messages (token request for background sync)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'GET_TOKEN') {
      var token = JWT_TOKEN || safeStorage.get('hrms_jwt');
      event.ports[0].postMessage({ token: token });
    }
  });
}

// Detect online/offline status
window.addEventListener('online', function() {
  showToast('Back online — syncing data...', 'success');
  // Trigger background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.sync.register('sync-attendance');
    });
  }
  // Refresh data
  if (typeof refreshNotifications === 'function') refreshNotifications();
});

window.addEventListener('offline', function() {
  showToast('You are offline. Check-in/checkout will sync when connected.', 'info');
});

// =====================================================
// PWA: CAMERA DOCUMENT SCANNER
// =====================================================
function scanDocument(callback) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = function() {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    // Compress if too large (>2MB)
    if (file.size > 2 * 1024 * 1024) {
      compressImage(file, function(compressed) {
        if (callback) callback(compressed);
      });
    } else {
      if (callback) callback(file);
    }
  };
  input.click();
}

function compressImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var maxSize = 1200;
      var w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = h * maxSize / w; w = maxSize; }
        else { w = w * maxSize / h; h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        callback(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Upload scanned document to server
function uploadScannedDocument(file, docType) {
  var formData = new FormData();
  formData.append('document', file);
  if (docType) formData.append('docType', docType);
  var token = JWT_TOKEN || safeStorage.get('hrms_jwt');
  return fetch('/api/employees/upload-doc', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  }).then(function(r) { return r.json(); });
}

// Scan & upload for Profile (Aadhaar/PAN)
function scanAndUploadDoc(docType) {
  scanDocument(function(file) {
    showToast('Uploading...', 'info');
    uploadScannedDocument(file, docType).then(function(data) {
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }
      if (data.url) {
        // Update local employee data so re-render shows the image
        var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; });
        if (emp) {
          if (docType === 'aadhaar_photo') emp.aadhaar_photo_url = data.url;
          if (docType === 'pan_photo') emp.pan_photo_url = data.url;
        }
        showToast('Document uploaded', 'success');
        renderProfileOverlay();
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    }).catch(function(e) { showToast('Upload error: ' + e.message, 'error'); });
  });
}

// Upload site progress photo
function uploadSitePhoto(projectId) {
  scanDocument(function(file) {
    showToast('Uploading site photo...', 'info');
    uploadScannedDocument(file).then(function(data) {
      if (data.url) {
        // Save photo URL as a daily log note
        var proj = projects.find(function(p) { return p.id === projectId; });
        var projName = proj ? proj.name : 'Project #' + projectId;
        apiCall('POST', '/sitetrack/projects/' + projectId + '/daily-logs', {
          logDate: new Date().toISOString().split('T')[0],
          workDescription: 'Site progress photo',
          weather: '',
          workersCount: 0,
          photo_url: data.url
        }).then(function() {
          showToast('Site photo uploaded for ' + projName, 'success');
          loadDailyLogs(projectId);
        }).catch(function() {
          showToast('Photo saved at ' + data.url + ' but log entry failed', 'info');
        });
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
  });
}

// Generic scan & upload — returns URL via callback
function scanAndUploadGeneric(callback) {
  scanDocument(function(file) {
    showToast('Uploading...', 'info');
    uploadScannedDocument(file).then(function(data) {
      if (data.url) {
        showToast('Uploaded', 'success');
        if (callback) callback(data.url);
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
  });
}


// =====================================================
// CHATBOT — Rule-based HR Assistant
// =====================================================
function toggleChatbot() {
  var win = document.getElementById('chatbotWindow');
  if (!win) return;
  var isOpen = win.style.display === 'flex';
  win.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) {
    var input = document.getElementById('chatInput');
    if (input) setTimeout(function() { input.focus(); }, 100);
  }
}

function sendChatMessage() {
  var input = document.getElementById('chatInput');
  if (!input) return;
  var msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  var container = document.getElementById('chatMessages');
  // Add user message
  container.innerHTML += '<div class="chat-msg user"><div class="chat-bubble user">' + escapeHTML(msg) + '</div></div>';
  // Add typing indicator
  container.innerHTML += '<div class="chat-msg bot" id="chatTyping"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  container.scrollTop = container.scrollHeight;

  // Call API
  var token = JWT_TOKEN || safeStorage.get('hrms_jwt');
  fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
    var reply = (data.reply || 'No response').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    container.innerHTML += '<div class="chat-msg bot"><div class="chat-bubble bot">' + reply + '</div></div>';
    container.scrollTop = container.scrollHeight;
  }).catch(function(e) {
    var typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
    container.innerHTML += '<div class="chat-msg bot"><div class="chat-bubble bot" style="color:#ef4444">Sorry, something went wrong. Please try again.</div></div>';
    container.scrollTop = container.scrollHeight;
  });
}

// Voice input using Web Speech API (free, built into browser)
var _voiceRecognition = null;

function startVoiceInput() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast('Voice input not supported in this browser. Use Chrome or Edge.', 'error'); return; }

  var micBtn = document.getElementById('chatMicBtn');

  // If already listening, stop
  if (_voiceRecognition) {
    _voiceRecognition.stop();
    _voiceRecognition = null;
    if (micBtn) { micBtn.style.background = '#f1f5f9'; micBtn.style.color = '#475569'; }
    return;
  }

  _voiceRecognition = new SpeechRecognition();
  _voiceRecognition.lang = 'en-IN';
  _voiceRecognition.interimResults = true;
  _voiceRecognition.maxAlternatives = 1;

  // Show listening state
  if (micBtn) { micBtn.style.background = '#ef4444'; micBtn.style.color = '#fff'; }
  var input = document.getElementById('chatInput');
  if (input) input.placeholder = 'Listening...';

  // Add listening indicator to chat
  var container = document.getElementById('chatMessages');
  container.innerHTML += '<div class="chat-msg bot" id="voiceListening"><div class="chat-bubble bot" style="color:#ef4444"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;animation:chatBounce .6s infinite alternate"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>Listening... speak now</div></div>';
  container.scrollTop = container.scrollHeight;

  _voiceRecognition.onresult = function(event) {
    var transcript = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (input) input.value = transcript;

    // If final result, auto-send
    if (event.results[event.results.length - 1].isFinal) {
      var listening = document.getElementById('voiceListening');
      if (listening) listening.remove();
      if (transcript.trim()) {
        sendChatMessage();
      }
    }
  };

  _voiceRecognition.onend = function() {
    _voiceRecognition = null;
    if (micBtn) { micBtn.style.background = '#f1f5f9'; micBtn.style.color = '#475569'; }
    if (input) input.placeholder = 'Type your question...';
    var listening = document.getElementById('voiceListening');
    if (listening) listening.remove();
  };

  _voiceRecognition.onerror = function(event) {
    _voiceRecognition = null;
    if (micBtn) { micBtn.style.background = '#f1f5f9'; micBtn.style.color = '#475569'; }
    if (input) input.placeholder = 'Type your question...';
    var listening = document.getElementById('voiceListening');
    if (listening) listening.remove();
    if (event.error === 'not-allowed') {
      showToast('Microphone access denied. Allow microphone in browser settings.', 'error');
    } else if (event.error !== 'aborted') {
      showToast('Voice error: ' + event.error, 'error');
    }
  };

  _voiceRecognition.start();
}

// Show chatbot button after login
function showChatbot() {
  var btn = document.getElementById('chatbotBtn');
  if (btn) btn.style.display = 'flex';
}
function hideChatbot() {
  var btn = document.getElementById('chatbotBtn');
  var win = document.getElementById('chatbotWindow');
  if (btn) btn.style.display = 'none';
  if (win) win.style.display = 'none';
}

function updateNotifBadge() {
  var badge = document.querySelector('.header-btn .badge') || document.querySelector('.badge');
  if (!badge) return;
  var unread = NOTIF_HISTORY.filter(function(n) { return !n.read; }).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = '';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

function renderNotifications() {
  const container = document.getElementById('notifListContainer');
  if (!container) return;
  if (NOTIF_HISTORY.length === 0) {
    container.innerHTML = '<div style="padding:40px 16px;text-align:center;color:var(--gray-400);font-size:.82rem">No notifications yet</div>';
    return;
  }
  const iconMap = {
    salary: {bg:'var(--success-light)',color:'var(--success-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    leave: {bg:'#FFF7ED',color:'#E85D04',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>'},
    advance: {bg:'var(--teal-light)',color:'var(--teal-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'},
    payroll: {bg:'var(--primary-50)',color:'var(--primary)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'},
    system: {bg:'var(--danger-light)',color:'var(--danger)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'},
    checkin: {bg:'var(--blue-light)',color:'var(--blue-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'},
    checkout: {bg:'var(--orange-light)',color:'var(--orange-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'},
    attendance: {bg:'var(--blue-light)',color:'var(--blue-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'},
    general: {bg:'var(--gray-100)',color:'var(--gray-600)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'},
    event: {bg:'var(--purple-light)',color:'var(--purple-dark)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'},
    announcement: {bg:'var(--amber-light)',color:'var(--amber)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'}
  };
  const defaultIcon = iconMap.general;
  container.innerHTML = NOTIF_HISTORY.map(n => {
    const ic = iconMap[n.category] || defaultIcon;
    const ago = timeAgo(n.time);
    return `<div class="notif-item${n.read?'':' unread'}" onclick="markNotifRead(${n.id})">
      <div class="notif-icon" style="background:${ic.bg};color:${ic.color}">${ic.svg}</div>
      <div class="notif-content"><h4>${escapeHTML(n.title)}</h4><p>${escapeHTML(n.body)}</p></div>
      <div class="notif-time">${ago}</div>
    </div>`;
  }).join('');
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs/24);
  return days + 'd ago';
}

function markNotifRead(id) {
  const n = NOTIF_HISTORY.find(n => n.id === id);
  if (n) { n.read = true; renderNotifications(); updateNotifBadge(); }
  apiCall('PATCH', '/notifications/' + id + '/read').catch(function(){});
}

function markAllNotifRead() {
  NOTIF_HISTORY.forEach(n => n.read = true);
  renderNotifications(); updateNotifBadge();
  // notifHistory saved to DB via API
  apiCall('PATCH', '/notifications/read-all').catch(function(){});
}

function toggleNotifPref(key, btn) {
  btn.classList.toggle('on');
  notifPrefs[key] = btn.classList.contains('on');
  // notifPrefs saved to DB via API
  apiCall('PUT', '/notifications/prefs', notifPrefs).catch(function(){});
}

function restoreNotifPrefToggles() {
  ['salary','leave','advance','payroll'].forEach(k => {
    const el = document.getElementById('notifPref' + k.charAt(0).toUpperCase() + k.slice(1));
    if (el) el.classList.toggle('on', notifPrefs[k] !== false);
  });
}


// =====================================================
// FEATURE 7: LEAVE MANAGEMENT WORKFLOW
// =====================================================
function getLeaveBalance(empCode) {
  if (!leaveBalances[empCode]) {
    leaveBalances[empCode] = { casual: 12, comp: 3, permission: 1 };
  }
  return leaveBalances[empCode];
}

function openLeaveForm() {
  if (currentUser && currentUser.role === 'MD') { showToast('MD does not apply for leave'); return; }
  document.getElementById('leaveFormOverlay').classList.add('active');
  selectedLeaveType = 'casual';
  // Update leave balance badge with monthly policy info
  var balText = document.getElementById('leaveBalText');
  if (balText && currentUser) {
    var bal = getLeaveBalance(currentUser.code);
    var rem = bal.casual || 0;
    var usedThisMonth = getCasualLeavesUsedThisMonth(currentUser.code);
    var monthlyPaid = Math.max(0, 1 - usedThisMonth);
    balText.innerHTML = 'Casual Leave: <strong>' + rem + '</strong> of 12 remaining this year' +
      '<br><span style="font-size:.7rem;color:' + (monthlyPaid > 0 ? 'var(--success)' : 'var(--danger)') + '">' +
      (monthlyPaid > 0 ? '1 paid leave available this month' : 'Paid leave used this month — additional leave will be LOP (salary deducted)') + '</span>';
  }
  document.querySelectorAll('#leaveTypePills .lt-pill').forEach((p,i) => p.classList.toggle('active', i===0));
  var today = new Date().toISOString().split('T')[0];
  var fromDate = document.getElementById('leaveFromDate');
  var toDate = document.getElementById('leaveToDate');
  fromDate.value = '';
  fromDate.setAttribute('min', today);
  toDate.value = '';
  toDate.setAttribute('min', today);
  document.getElementById('leaveReason').value = '';
  // Reset half day
  var halfToggle = document.getElementById('halfDayToggle');
  if (halfToggle) halfToggle.classList.remove('on');
  var timeFields = document.getElementById('halfDayTimeFields');
  if (timeFields) timeFields.style.display = 'none';
  // Populate time dropdowns
  var fromTime = document.getElementById('leaveFromTime');
  var toTime = document.getElementById('leaveToTime');
  if (fromTime && toTime) {
    var opts = '';
    for (var h = 9; h <= 18; h++) {
      var hh = h < 10 ? '0' + h : '' + h;
      opts += '<option value="' + hh + ':00">' + hh + ':00</option>';
      if (h < 18) opts += '<option value="' + hh + ':30">' + hh + ':30</option>';
    }
    fromTime.innerHTML = opts;
    toTime.innerHTML = opts;
    fromTime.value = '09:00';
    toTime.value = '13:00';
  }
}

function toggleHalfDay() {
  var toggle = document.getElementById('halfDayToggle');
  var fields = document.getElementById('halfDayTimeFields');
  toggle.classList.toggle('on');
  var isOn = toggle.classList.contains('on');
  fields.style.display = isOn ? '' : 'none';
  if (isOn) {
    var toDate = document.getElementById('leaveToDate');
    var fromDate = document.getElementById('leaveFromDate');
    if (fromDate.value) toDate.value = fromDate.value;
  }
}

function closeLeaveForm() {
  document.getElementById('leaveFormOverlay').classList.remove('active');
}

function selectLeaveType(type, el) {
  selectedLeaveType = type;
  document.querySelectorAll('#leaveTypePills .lt-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  // Update balance text for selected type
  var balText = document.getElementById('leaveBalText');
  if (balText && currentUser) {
    var bal = getLeaveBalance(currentUser.code);
    if (type === 'permission') {
      var permLeft = bal.permission !== undefined ? bal.permission : 1;
      balText.innerHTML = 'Permission (2hr): <strong>' + permLeft + '</strong> of 1 remaining this month' +
        '<br><span style="font-size:.7rem;color:' + (permLeft > 0 ? 'var(--success)' : 'var(--danger)') + '">' +
        (permLeft > 0 ? '1 free permission available — no salary deduction' : 'Permission used this month — additional will be LOP') + '</span>';
      // Auto-set same-day dates for permission
      var today = new Date().toISOString().split('T')[0];
      var fromEl = document.getElementById('leaveFromDate');
      var toEl = document.getElementById('leaveToDate');
      if (fromEl) fromEl.value = today;
      if (toEl) toEl.value = today;
    } else {
      var rem = bal.casual || 0;
      var usedThisMonth = getCasualLeavesUsedThisMonth(currentUser.code);
      var monthlyPaid = Math.max(0, 1 - usedThisMonth);
      balText.innerHTML = 'Casual Leave: <strong>' + rem + '</strong> of 12 remaining this year' +
        '<br><span style="font-size:.7rem;color:' + (monthlyPaid > 0 ? 'var(--success)' : 'var(--danger)') + '">' +
        (monthlyPaid > 0 ? '1 paid leave available this month' : 'Paid leave used this month — additional leave will be LOP (salary deducted)') + '</span>';
    }
  }
}

// Check how many casual leaves used this month
function getCasualLeavesUsedThisMonth(empCode) {
  var now = new Date();
  var month = now.getMonth();
  var year = now.getFullYear();
  return leaveApplications.filter(function(a) {
    if (a.empCode !== empCode) return false;
    if (a.type !== 'casual') return false;
    if (a.status === 'rejected') return false;
    var d = new Date(a.from);
    return d.getMonth() === month && d.getFullYear() === year;
  }).reduce(function(sum, a) { return sum + (a.days || 1); }, 0);
}

async function submitLeave() {
  if (!currentUser) return;
  const from = document.getElementById('leaveFromDate').value;
  const to = document.getElementById('leaveToDate').value;
  const reason = document.getElementById('leaveReason').value.trim();
  if (!from || !to) { showToast('Please select dates'); return; }
  if (new Date(to) < new Date(from)) { showToast('End date must be after start date'); return; }
  var today = new Date().toISOString().split('T')[0];
  if (from < today) { showToast('Cannot apply leave for past dates'); return; }
  if (!reason) { showToast('Please enter a reason'); return; }

  var halfDayToggle = document.getElementById('halfDayToggle');
  var isHalfDay = halfDayToggle && halfDayToggle.classList.contains('on');
  const days = isHalfDay ? 0.5 : Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  const bal = getLeaveBalance(currentUser.code);

  // Leave policy: 1 casual leave per month (paid), extra = LOP (salary deducted)
  var casualUsedThisMonth = getCasualLeavesUsedThisMonth(currentUser.code);
  var paidAvailable = Math.max(0, 1 - casualUsedThisMonth); // 1 per month
  var leaveType = selectedLeaveType;
  var isLOP = false;

  if (leaveType === 'permission') {
    // Permission: 2 per month, same day only
    if (from !== to) { showToast('Permission is for 2 hours on a single day only'); return; }
    var permLeft = bal.permission !== undefined ? bal.permission : 1;
    if (permLeft <= 0) {
      isLOP = true;
      if (!confirm('You have already used your 1 permission this month.\n\nThis permission will be Loss of Pay (LOP) — 2 hours salary will be deducted.\n\nDo you want to proceed?')) return;
    }
  } else if (leaveType === 'casual') {
    if (bal.casual <= 0) {
      // No casual balance left — entire request is LOP
      isLOP = true;
      if (!confirm('You have exhausted all 12 casual leaves for this year.\n\nThis leave will be Loss of Pay (LOP) — salary for ' + days + ' day(s) will be deducted.\n\nDo you want to proceed?')) return;
    } else if (days > paidAvailable) {
      // Partially paid, partially LOP
      var lopDays = days - paidAvailable;
      if (!confirm('You have used your 1 paid casual leave for this month.\n\n' + (paidAvailable > 0 ? paidAvailable + ' day(s) will be paid leave.\n' : '') + lopDays + ' day(s) will be Loss of Pay (LOP) — salary will be deducted for those days.\n\nDo you want to proceed?')) return;
      isLOP = lopDays > 0;
    }
    // Check yearly balance
    if (bal.casual < days && !isLOP) {
      if (!confirm('You only have ' + bal.casual + ' casual leave(s) remaining this year.\n\n' + (days - bal.casual) + ' day(s) will be Loss of Pay (LOP) — salary will be deducted.\n\nDo you want to proceed?')) return;
      isLOP = true;
    }
  }

  try {
    var lopFlag = isLOP || (leaveType === 'casual' && days > paidAvailable);
    var apiRes = await apiCall('POST', '/leaves', { type: leaveType, from: from, to: to, reason: reason, isLOP: lopFlag, isHalfDay: isHalfDay });
    var app = {
      id: (apiRes && apiRes.id) || leaveNextId++,
      empCode: currentUser.code,
      empName: currentUser.name,
      dept: currentUser.dept,
      type: leaveType,
      from: from, to: to, days: days, reason: reason,
      status: 'pending',
      isLOP: lopFlag,
      date: new Date().toISOString()
    };
    leaveApplications.push(app);
    var leaveBtn = document.querySelector('.leave-form-overlay .btn-primary, .leave-form-overlay .nf-btn-primary');
    _submitSuccess(leaveBtn);
    if (lopFlag) {
      showToast('Leave submitted — salary deduction will apply for LOP days');
    } else {
      showToast('Leave application submitted (paid leave)');
    }
    setTimeout(function() { closeLeaveForm(); renderLeaveScreen(); }, 1500);
    refreshNotifications();
  } catch (e) {
    var leaveBtnE = document.querySelector('.leave-form-overlay .btn-primary, .leave-form-overlay .nf-btn-primary');
    _submitError(leaveBtnE, 'Failed');
    showToast(e.message || 'Error submitting leave');
  }
}

async function approveLeave(id) {
  try {
    const app = leaveApplications.find(a => a.id === id);
    if (!app) return;
    // HR can only accept (not final approve)
    if (currentUser.role === 'HR' && app.status === 'pending') {
      await hrAcceptLeave(id);
      return;
    }
    // MD can only approve after HR has accepted
    if (currentUser.role === 'MD' && app.status === 'pending') {
      showToast('HR must accept this leave first');
      return;
    }
    // MD confirms (from hr_accepted only)
    await apiCall('PATCH', '/leaves/' + id + '/approve');
    app.status = 'approved';
    const bal = getLeaveBalance(app.empCode);
    bal[app.type] = Math.max(0, bal[app.type] - app.days);
    renderLeaveScreen();
    showToast('Leave approved');
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error approving leave'); }
}

async function rejectLeave(id) {
  try {
    const app = leaveApplications.find(a => a.id === id);
    if (!app) return;
    await apiCall('PATCH', '/leaves/' + id + '/reject');
    app.status = 'rejected';
    renderLeaveScreen();
    showToast('Leave rejected');
    refreshNotifications();
  } catch (err) { showToast(err.message || 'Error rejecting leave'); }
}

function switchLeaveTab(tab, el) {
  document.querySelectorAll('#leaveTabPills .tab-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('myLeavesTab').style.display = tab === 'my' ? '' : 'none';
  document.getElementById('teamLeavesTab').style.display = tab === 'team' ? '' : 'none';
  document.getElementById('holidaysTab').style.display = tab === 'holidays' ? '' : 'none';
}

function renderLeaveScreen() {
  if (!currentUser) return;
  const isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';
  const isMD = currentUser.role === 'MD';
  const isHR = currentUser.role === 'HR';
  const bal = getLeaveBalance(currentUser.code);
  const circumference = 163.4;
  // Hide apply button and balance for MD
  var applyBtn = document.getElementById('applyLeaveBtn');
  if (applyBtn) applyBtn.style.display = isMD ? 'none' : '';

  // Balance grid (hidden for MD)
  const balGrid = document.getElementById('leaveBalanceGrid');
  if (balGrid) {
    if (isMD) {
      balGrid.innerHTML = '';
    } else {
      const leaveTypes = [
        {key:'casual',label:'Casual Leave',total:12,color:'#E85D04',cls:'casual'},
        {key:'comp',label:'Comp Off',total:3,color:'#0891b2',cls:'comp'},
        {key:'permission',label:'Permission (2hr)',total:1,color:'#d97706',cls:'permission'}
      ];
      balGrid.innerHTML = '<div class="section-title" style="margin-top:4px">Leave Balance</div><div class="leave-balance-grid fade-in">' +
        leaveTypes.map(lt => {
          const rem = bal[lt.key] || 0;
          const used = lt.total - rem;
          const offset = circumference * (used / lt.total);
          return `<div class="leave-balance-card ${lt.cls}"><div class="donut-chart"><svg viewBox="0 0 65 65"><circle class="donut-bg" cx="32.5" cy="32.5" r="26"/><circle class="donut-fill" cx="32.5" cy="32.5" r="26" stroke="${lt.color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg><div class="donut-center">${rem}</div></div><div class="leave-type-name">${lt.label}</div><div class="leave-detail">${rem} of ${lt.total} remaining</div></div>`;
        }).join('') + '</div>';
    }
  }

  // Hide "My Leaves" tab pill for MD, default to Team Leaves
  var myPill = document.querySelector('#leaveTabPills [data-ltab="my"]');
  if (myPill) myPill.style.display = isMD ? 'none' : '';
  if (isMD) {
    document.getElementById('myLeavesTab').style.display = 'none';
    document.getElementById('teamLeavesTab').style.display = '';
    var teamPill = document.querySelector('#leaveTabPills [data-ltab="team"]');
    if (teamPill) teamPill.classList.add('active');
  }

  // My leaves
  const myTab = document.getElementById('myLeavesTab');
  if (myTab && !isMD) {
    const myApps = leaveApplications.filter(a => a.empCode === currentUser.code);
    if (myApps.length === 0) {
      myTab.innerHTML = '<div style="padding:16px;text-align:center;font-size:.78rem;color:var(--gray-400)">No leave applications yet</div>';
    } else {
      myTab.innerHTML = myApps.map(a => {
        const badgeCls = a.status === 'approved' ? 'badge-approved' : a.status === 'rejected' ? 'badge-rejected' : a.status === 'hr_accepted' ? '' : 'badge-pending';
        const badgeStyle = a.status === 'hr_accepted' ? ' style="background:#DBEAFE;color:#1D4ED8"' : '';
        const statusLabel = a.status === 'hr_accepted' ? 'HR Accepted' : a.status.charAt(0).toUpperCase()+a.status.slice(1);
        const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
        const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
        var lopBadge = a.isLOP ? '<span style="display:inline-block;font-size:.55rem;padding:1px 5px;border-radius:4px;background:#FEE2E2;color:#DC2626;margin-left:4px;font-weight:600">LOP</span>' : '<span style="display:inline-block;font-size:.55rem;padding:1px 5px;border-radius:4px;background:#DCFCE7;color:#16A34A;margin-left:4px;font-weight:600">PAID</span>';
        return `<div class="request-item"><div class="req-icon" style="background:#FFF7ED;color:#E85D04"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg></div><div class="req-info"><h4>${a.type.charAt(0).toUpperCase()+a.type.slice(1)} Leave${lopBadge}</h4><p>${fromD} — ${toD} &middot; ${a.days} day(s)</p></div><div class="req-meta"><span class="badge-status ${badgeCls}"${badgeStyle}>${statusLabel}</span></div></div>`;
      }).join('');
    }
  }

  // Team leaves (MD/HR only)
  const teamTab = document.getElementById('teamLeavesTab');
  if (teamTab) {
    if (!isMDorHR) {
      teamTab.innerHTML = '<div style="padding:16px;text-align:center;font-size:.78rem;color:var(--gray-400)">Only MD/HR can view team leaves</div>';
    } else {
      const pending = leaveApplications.filter(a => a.status === 'pending');
      const hrAccepted = leaveApplications.filter(a => a.status === 'hr_accepted');
      const others = leaveApplications.filter(a => a.status !== 'pending' && a.status !== 'hr_accepted');
      let html = '';
      if (pending.length > 0) {
        if (isMD) html += '<div style="font-size:.72rem;font-weight:600;color:var(--gray-400);margin:8px 0 4px">Pending — Awaiting HR Acceptance</div>';
        html += pending.map(a => {
          const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          // HR sees Accept/Reject buttons, MD sees "Awaiting HR" badge (cannot act on pending)
          var actionsHtml = '';
          if (isHR) {
            actionsHtml = `<div class="leave-action-btns" style="width:100%;margin-top:8px"><button style="background:#DBEAFE;color:#1D4ED8" onclick="approveLeave(${a.id})">Accept</button><button style="background:var(--danger-light);color:var(--danger-dark)" onclick="rejectLeave(${a.id})">Reject</button></div>`;
          } else if (isMD) {
            actionsHtml = `<div style="margin-top:6px"><span class="badge-status badge-pending">Awaiting HR</span></div>`;
          }
          return `<div class="request-item" style="flex-wrap:wrap"><div class="req-icon" style="background:#FCE7F3;color:#DB2777"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="req-info"><h4>${escapeHTML(a.empName)} — ${escapeHTML(a.type)} Leave</h4><p>${escapeHTML(a.dept)} &middot; ${fromD} — ${toD} &middot; ${a.days} day(s)</p><p style="font-size:.65rem;color:var(--gray-500);margin-top:2px">${escapeHTML(a.reason)}</p></div>${actionsHtml}</div>`;
        }).join('');
      }
      if (hrAccepted.length > 0 && isMD) {
        html += '<div style="font-size:.72rem;font-weight:600;color:#1D4ED8;margin:8px 0 4px">HR Accepted — Awaiting Confirmation</div>';
        html += hrAccepted.map(a => {
          const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          return `<div class="request-item" style="flex-wrap:wrap"><div class="req-icon" style="background:#DBEAFE;color:#1D4ED8"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/></svg></div><div class="req-info"><h4>${escapeHTML(a.empName)} — ${escapeHTML(a.type)} Leave</h4><p>${escapeHTML(a.dept)} &middot; ${fromD} — ${toD} &middot; ${a.days} day(s)</p></div><div class="leave-action-btns" style="width:100%;margin-top:8px"><button style="background:var(--success-light);color:var(--success-dark)" onclick="approveLeave(${a.id})">Confirm</button><button style="background:var(--danger-light);color:var(--danger-dark)" onclick="rejectLeave(${a.id})">Reject</button></div></div>`;
        }).join('');
      } else if (hrAccepted.length > 0 && isHR) {
        html += '<div style="font-size:.72rem;font-weight:600;color:#1D4ED8;margin:8px 0 4px">Awaiting MD Confirmation</div>';
        html += hrAccepted.map(a => {
          const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          return `<div class="request-item"><div class="req-icon" style="background:#DBEAFE;color:#1D4ED8"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/></svg></div><div class="req-info"><h4>${escapeHTML(a.empName)} — ${escapeHTML(a.type)}</h4><p>${escapeHTML(a.dept)} &middot; ${fromD} — ${toD}</p></div><span class="badge-status" style="background:#DBEAFE;color:#1D4ED8">HR Accepted</span></div>`;
        }).join('');
      }
      if (others.length > 0) {
        html += others.slice(0, 10).map(a => {
          const badgeCls = a.status === 'approved' ? 'badge-approved' : 'badge-rejected';
          const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          return `<div class="request-item"><div class="req-icon" style="background:#D1FAE5;color:#059669"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="req-info"><h4>${escapeHTML(a.empName)} — ${escapeHTML(a.type)}</h4><p>${escapeHTML(a.dept)} &middot; ${fromD} — ${toD}</p></div><div class="req-meta"><span class="badge-status ${badgeCls}">${escapeHTML(a.status)}</span></div></div>`;
        }).join('');
      }
      if (!html) html = '<div style="padding:16px;text-align:center;font-size:.78rem;color:var(--gray-400)">No leave applications</div>';
      teamTab.innerHTML = html;
    }
  }
}

// =====================================================
// FEATURE 8: MOBILE RESPONSIVENESS (iOS PDF fix)
// =====================================================
function savePdfSafe(doc, filename) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } else {
    doc.save(filename);
  }
}

// =====================================================
// F1: SHIFT MANAGEMENT FUNCTIONS
// =====================================================
function getShiftTime(s) {
  if (s.time) return s.time;
  return (s.start || '00:00') + ' - ' + (s.end || '00:00');
}
function getEmployeeShift(empCode) {
  return shiftAssignments[empCode] || null;
}
function isShiftEligible(emp) {
  return SHIFT_ELIGIBLE_DEPTS.includes(emp.dept);
}
async function assignShift(empCode, shiftCode) {
  try {
    await apiCall('PUT', '/shifts/' + empCode, { shift_code: shiftCode });
    shiftAssignments[empCode] = { shiftCode: shiftCode, assignedBy: currentUser.code, assignedDate: new Date().toISOString().split('T')[0] };
    renderShiftsOverlay();
    showToast('Shift assigned successfully');
  } catch (e) { showToast(e.message || 'Error assigning shift'); }
}
function toggleShiftEligibility(empCode) {
  if (shiftAssignments[empCode] && shiftAssignments[empCode].disabled) {
    delete shiftAssignments[empCode].disabled;
  } else {
    if (!shiftAssignments[empCode]) shiftAssignments[empCode] = {};
    shiftAssignments[empCode].disabled = true;
  }
  renderShiftsOverlay();
}
function renderMyShiftCard() {
  if (!currentUser || !isShiftEligible(currentUser)) return '';
  const assignment = getEmployeeShift(currentUser.code);
  const shift = assignment && assignment.shiftCode ? SHIFT_TYPES.find(s => s.code === assignment.shiftCode) : SHIFT_TYPES[0];
  return `<div class="my-shift-card"><h4>My Shift: ${shift.name}</h4><p>${getShiftTime(shift)}</p></div>`;
}
function renderShiftsOverlay() {
  const c = document.getElementById('shiftsContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  const eligible = EMPLOYEES.filter(e => isShiftEligible(e));

  let html = '<div class="nf-section"><div style="display:flex;align-items:center;justify-content:space-between"><div class="nf-section-title">Shift Types</div>';
  if (isMdHr) {
    html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openShiftTypeForm()">+ New Shift</button>';
  }
  html += '</div><div id="shiftTypeFormArea"></div>';
  SHIFT_TYPES.forEach(function(s) {
    var time = getShiftTime(s);
    html += '<div class="shift-card"><div class="shift-badge" style="background:' + s.color + '20;color:' + s.color + '">' + escapeHTML(s.code) + '</div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">' + escapeHTML(s.name) + '</div><div style="font-size:.72rem;color:var(--gray-500)">' + escapeHTML(time) + '</div></div>';
    if (isMdHr) {
      html += '<button style="background:none;border:none;cursor:pointer;padding:4px" onclick="editShiftType(\'' + escapeAttr(s.code) + '\')" title="Edit shift" aria-label="Edit ' + escapeAttr(s.name) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
      html += '<button style="background:none;border:none;cursor:pointer;padding:4px" onclick="deleteShiftType(\'' + escapeAttr(s.code) + '\')" title="Delete shift" aria-label="Delete ' + escapeAttr(s.name) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
    }
    html += '</div>';
  });
  html += '</div><div class="nf-section"><div class="nf-section-title">Factory Employees (' + eligible.length + ')</div>';
  eligible.forEach(function(emp) {
    const a = shiftAssignments[emp.code] || {};
    const disabled = a.disabled;
    const shift = a.shiftCode ? SHIFT_TYPES.find(s => s.code === a.shiftCode) : SHIFT_TYPES[0];
    html += '<div class="shift-card"><div style="flex:1"><div style="font-weight:600;font-size:.82rem">' + escapeHTML(emp.name) + '</div><div style="font-size:.72rem;color:var(--gray-500)">' + escapeHTML(emp.designation || '') + '</div></div>';
    if (disabled) {
      html += '<span style="font-size:.7rem;color:var(--gray-400)">Disabled</span>';
    } else {
      html += '<div class="shift-badge" style="background:' + shift.color + '20;color:' + shift.color + '">' + escapeHTML(shift.name) + '</div>';
    }
    if (isMdHr) {
      html += '<button class="shift-toggle ' + (disabled?'':'on') + '" onclick="toggleShiftEligibility(\'' + escapeAttr(emp.code) + '\')" title="Toggle eligibility" aria-label="Toggle shift eligibility for ' + escapeAttr(emp.name) + '"></button>';
      if (!disabled) {
        html += '<select class="nf-select" style="width:auto;min-width:80px;font-size:.7rem;padding:4px 6px" onchange="assignShift(\'' + escapeAttr(emp.code) + '\',this.value)" aria-label="Assign shift for ' + escapeAttr(emp.name) + '">';
        SHIFT_TYPES.forEach(function(s) {
          html += '<option value="' + s.code + '" ' + (a.shiftCode===s.code?'selected':'') + '>' + escapeHTML(s.code) + '</option>';
        });
        html += '</select>';
      }
    }
    html += '</div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

function openShiftTypeForm(editCode) {
  var existing = editCode ? SHIFT_TYPES.find(function(s){return s.code===editCode;}) : null;
  var area = document.getElementById('shiftTypeFormArea');
  if (!area) return;
  var colors = ['#2563EB','#D97706','#7C3AED','#059669','#DC2626','#EC4899','#0891B2','#4F46E5'];
  var colorOpts = colors.map(function(cl) {
    return '<option value="' + cl + '"' + (existing && existing.color===cl ? ' selected' : '') + ' style="color:' + cl + '">' + cl + '</option>';
  }).join('');

  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin:8px 0">' +
    '<div class="nf-section-title" style="margin-bottom:8px">' + (existing ? 'Edit Shift' : 'New Shift') + '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Code *</label><input class="form-control" id="shiftCode" maxlength="5" value="' + (existing ? escapeHTML(existing.code) : '') + '"' + (existing ? ' readonly style="opacity:.6"' : '') + '></div>' +
    '<div class="form-group" style="flex:2"><label class="form-label">Name *</label><input class="form-control" id="shiftName" value="' + (existing ? escapeHTML(existing.name) : '') + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Start Time *</label><input class="form-control" type="time" id="shiftStart" value="' + (existing ? (existing.start || '') : '') + '"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">End Time *</label><input class="form-control" type="time" id="shiftEnd" value="' + (existing ? (existing.end || '') : '') + '"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Color</label><select class="form-control" id="shiftColor">' + colorOpts + '</select></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveShiftType(\'' + (editCode || '') + '\')">' + (existing ? 'Update' : 'Create') + '</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="renderShiftsOverlay()">Cancel</button>' +
    '</div></div>';
}

async function saveShiftType(editCode) {
  var code = document.getElementById('shiftCode').value.trim().toUpperCase();
  var name = document.getElementById('shiftName').value.trim();
  var start = document.getElementById('shiftStart').value;
  var end = document.getElementById('shiftEnd').value;
  var color = document.getElementById('shiftColor').value;

  if (!code || !name || !start || !end) { showToast('Please fill all required fields'); return; }

  try {
    if (editCode) {
      await apiCall('PUT', '/shifts/types/' + editCode, { name: name, start_time: start, end_time: end, color: color });
      var shift = SHIFT_TYPES.find(function(s){return s.code===editCode;});
      if (shift) { shift.name = name; shift.start = start; shift.end = end; shift.color = color; }
      showToast('Shift updated');
    } else {
      if (SHIFT_TYPES.find(function(s){return s.code===code;})) { showToast('Shift code already exists'); return; }
      await apiCall('POST', '/shifts/types', { code: code, name: name, start_time: start, end_time: end, color: color });
      SHIFT_TYPES.push({code:code, name:name, start:start, end:end, color:color});
      showToast('Shift created');
    }
  } catch (e) { showToast('Failed to save shift type'); }
  renderShiftsOverlay();
}

function editShiftType(code) {
  openShiftTypeForm(code);
}

async function deleteShiftType(code) {
  if (isTemporaryMD()) { showToast('Temporary MD does not have delete permissions'); return; }
  if (SHIFT_TYPES.length <= 1) { showToast('Cannot delete the last shift type'); return; }
  var shift = SHIFT_TYPES.find(function(s){return s.code===code;});
  if (!shift) return;
  if (!confirm('Delete shift "' + shift.name + '"? Employees on this shift will be reassigned to the first available shift.')) return;
  try {
    await apiCall('DELETE', '/shifts/types/' + code);
    SHIFT_TYPES = SHIFT_TYPES.filter(function(s){return s.code!==code;});
    var fallback = SHIFT_TYPES[0].code;
    Object.keys(shiftAssignments).forEach(function(empCode) {
      if (shiftAssignments[empCode].shiftCode === code) {
        shiftAssignments[empCode].shiftCode = fallback;
      }
    });
    showToast('Shift deleted');
  } catch (e) { showToast('Failed to delete shift type'); }
  renderShiftsOverlay();
}

// =====================================================
// F2: EXPENSE REIMBURSEMENT FUNCTIONS
// =====================================================
async function submitExpenseReimbursement() {
  // Use stored preview data if available (preview replaces form inputs)
  var stored = window._expPreviewData || {};
  var cat = stored.cat || (document.getElementById('expCategory') || {}).value || '';
  var amount = stored.amount || parseFloat((document.getElementById('expAmount') || {}).value) || 0;
  var desc = stored.desc || ((document.getElementById('expDesc') || {}).value || '').trim();
  var date = stored.date || (document.getElementById('expDate') || {}).value || '';
  var billFile = stored.billFile || null;
  if (!billFile) { var billInput = document.getElementById('expBillInput'); if (billInput && billInput.files && billInput.files[0]) billFile = billInput.files[0]; }
  if (!cat || !amount || !date) { showToast('Please fill all required fields'); return; }
  var expClaimBtn = document.querySelector('#expensesContent .nf-btn-primary');
  _submitStart(expClaimBtn);
  try {
    var fd = new FormData();
    fd.append('category', cat);
    fd.append('amount', amount);
    fd.append('description', desc);
    fd.append('date', date);
    if (billFile) fd.append('bill', billFile);
    var res = await apiUpload('/expenses', fd);
    var exp = {
      id: (res && res.id) || expReimbNextId++, empCode: currentUser.code, empName: currentUser.name, dept: currentUser.dept,
      category: cat, amount: amount, description: desc, date: date, status: 'Pending',
      submittedOn: new Date().toISOString().split('T')[0], billUrl: res.billUrl || ''
    };
    expenseReimbursements.push(exp);
    addNotification('Expense claim submitted: Rs.' + amount.toLocaleString('en-IN'), 'expense');
    _submitSuccess(expClaimBtn);
    window._expPreviewData = null;
    showToast('Expense claim submitted');
    setTimeout(function() { renderExpenseOverlay(); }, 1200);
  } catch (e) {
    _submitError(expClaimBtn, 'Failed');
    showToast(e.message || 'Error submitting expense');
  }
}
// Accounts step: Pending → accounts_accepted (forwarded to MD)
async function accountsAcceptExpense(id) {
  try {
    var exp = expenseReimbursements.find(function(e) { return e.id === id; });
    if (!exp) return;
    await apiCall('PUT', '/expenses/' + id + '/approve', {});
    exp.status = 'accounts_accepted';
    exp.approvedBy = currentUser.name + ' (Accounts)';
    exp.approvedOn = new Date().toISOString().split('T')[0];
    showToast('Accepted Rs.' + exp.amount.toLocaleString('en-IN') + ' — forwarded to MD');
    renderAdvanceRequests(advReqActiveTab);
  } catch (e) { showToast(e.message || 'Error accepting expense'); }
}
// Backwards-compatible alias for any stale UI references (older overlays might still call hrAcceptExpense).
async function hrAcceptExpense(id) { return accountsAcceptExpense(id); }

async function approveExpense(id) {
  try {
    var exp = expenseReimbursements.find(function(e) { return e.id === id; });
    if (!exp) return;
    // MD must wait for Accounts to accept first
    var s = String(exp.status || '').toLowerCase();
    if (currentUser.role === 'MD' && s !== 'accounts_accepted' && s !== 'pending') {
      showToast('Accounts must accept this expense first'); return;
    }
    await apiCall('PUT', '/expenses/' + id + '/approve', {});
    exp.status = 'Approved';
    exp.approvedBy = currentUser.name + ' (' + currentUser.role + ')';
    exp.approvedOn = new Date().toISOString().split('T')[0];
    renderExpenseOverlay(); renderAdvanceRequests(advReqActiveTab);
    showToast('Expense approved — sent back to Accounts to disburse');
  } catch (e) { showToast(e.message || 'Error approving expense'); }
}

// Accounts final step: Approved → Paid (records who paid + when)
async function markExpensePaid(id) {
  try {
    var exp = expenseReimbursements.find(function(e) { return e.id === id; });
    if (!exp) return;
    if (!confirm('Confirm: Rs.' + exp.amount.toLocaleString('en-IN') + ' has been disbursed for this expense?')) return;
    await apiCall('PUT', '/expenses/' + id + '/mark-paid', {});
    exp.status = 'Paid';
    exp.paidBy = currentUser.code;
    exp.paidDate = new Date().toISOString().split('T')[0];
    renderExpenseOverlay(); renderAdvanceRequests(advReqActiveTab);
    showToast('Marked as paid — Rs.' + exp.amount.toLocaleString('en-IN'));
  } catch (e) { showToast(e.message || 'Error marking as paid'); }
}

async function rejectExpense(id) {
  try {
    var exp = expenseReimbursements.find(function(e) { return e.id === id; });
    if (!exp) return;
    await apiCall('PUT', '/expenses/' + id + '/reject', {});
    exp.status = 'Rejected'; exp.rejectedBy = currentUser.code;
    renderExpenseOverlay(); renderAdvanceRequests(advReqActiveTab); showToast('Expense rejected');
  } catch (e) { showToast(e.message || 'Error rejecting expense'); }
}
function renderExpenseOverlay() {
  const c = document.getElementById('expensesContent');
  if (!c) return;
  // Reviewers (MD + Accounts + HR) see everyone's claims; everyone else sees their own.
  const isMD = currentUser && currentUser.role === 'MD';
  const isAccounts = currentUser && currentUser.role === 'Accounts';
  const isHR = currentUser && currentUser.role === 'HR';
  const isReviewer = isMD || isAccounts || isHR;
  let html = '<div style="display:flex;gap:8px;margin-bottom:12px"><button class="nf-btn nf-btn-primary" onclick="openExpenseApplyForm()">+ New Claim</button></div>';
  const myExps = isReviewer ? expenseReimbursements : expenseReimbursements.filter(e => e.empCode === currentUser.code);
  if (myExps.length === 0) {
    html += '<div class="nf-empty">No expense claims yet</div>';
  } else {
    myExps.sort((a,b) => b.id - a.id).forEach(exp => {
      var sLower = String(exp.status || '').toLowerCase();
      var badgeCls =
        sLower === 'approved'           ? 'badge-approved' :
        sLower === 'rejected'           ? 'badge-rejected' :
        sLower === 'paid'               ? 'badge-approved' :
                                          'badge-pending';
      var statusLabel =
        sLower === 'accounts_accepted'  ? 'Accounts Accepted' :
        sLower === 'hr_accepted'        ? 'Accounts Accepted' :  // legacy display
        sLower === 'paid'               ? 'Paid'                :
                                          exp.status;
      const catIcons = {'Travel':'🚗','Food':'🍽️','Accommodation':'🏨','Equipment':'🔧','Office Supplies':'📎','Medical':'🏥','Fuel':'⛽','Other':'📦'};
      html += `<div class="expense-item"><div class="expense-cat-icon" style="background:var(--gray-100)">${catIcons[exp.category]||'📦'}</div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${escapeHTML(exp.category)}</div><div style="font-size:.72rem;color:var(--gray-500)">${escapeHTML(exp.empName)} &middot; ${exp.date}</div>${exp.description?'<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">'+escapeHTML(exp.description)+'</div>':''}${exp.billUrl?'<a href="'+escapeHTML(exp.billUrl)+'" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;margin-top:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>View Bill</a>':''}</div><div style="text-align:right"><div class="expense-amount">Rs.${exp.amount.toLocaleString('en-IN')}</div><span class="badge-status ${badgeCls}">${escapeHTML(statusLabel)}</span>`;
      // Action buttons — Accounts/HR accepts Pending, MD confirms accounts_accepted, Accounts/HR marks Paid
      if ((isAccounts || isHR) && exp.status === 'Pending') {
        html += `<div style="margin-top:4px;display:flex;gap:4px">
          <button class="nf-btn nf-btn-warning nf-btn-sm" onclick="accountsAcceptExpense(${exp.id})" style="font-size:.6rem">Accept</button>
          <button class="nf-btn nf-btn-danger nf-btn-sm" onclick="rejectExpense(${exp.id})">✗</button>
        </div>`;
      } else if (isMD && (sLower === 'accounts_accepted' || sLower === 'hr_accepted' || exp.status === 'Pending')) {
        html += `<div style="margin-top:4px;display:flex;gap:4px">
          <button class="nf-btn nf-btn-success nf-btn-sm" onclick="approveExpense(${exp.id})">✓</button>
          <button class="nf-btn nf-btn-danger nf-btn-sm" onclick="rejectExpense(${exp.id})">✗</button>
        </div>`;
      } else if ((isAccounts || isHR) && exp.status === 'Approved') {
        html += `<div style="margin-top:4px;display:flex;gap:4px">
          <button class="nf-btn nf-btn-success nf-btn-sm" onclick="markExpensePaid(${exp.id})" style="background:#10B981" title="Mark as paid">Mark Paid</button>
        </div>`;
      }
      html += '</div></div>';
    });
  }
  c.innerHTML = html;
}
function openExpenseApplyForm() {
  const c = document.getElementById('expensesContent');
  // Find approved travel advances for current user
  var myAdvances = (typeof advanceRequests !== 'undefined' ? advanceRequests : []).filter(function(a) {
    return a.empCode === currentUser.code && a.type === 'travel' && a.status === 'approved';
  });
  var advTotal = myAdvances.reduce(function(s, a) { return s + (a.amount || 0); }, 0);

  let html = '<div class="card" style="margin-bottom:12px"><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">New Expense Claim</h3>';
  html += '<div class="ss-form-group"><label>Category *</label><select class="nf-select" id="expCategory"><option value="">Select</option>';
  EXPENSE_CATEGORIES.forEach(cat => html += `<option>${cat}</option>`);
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Advance Amount Received (Rs.)</label><input type="number" id="expAdvanceAmt" value="' + advTotal + '" readonly style="background:var(--gray-50);cursor:not-allowed"></div>';
  html += '<div class="ss-form-group"><label>Total Amount Spent (Rs.) *</label><input type="number" id="expAmount" placeholder="e.g. 5000"></div>';
  html += '<div class="ss-form-group"><label>Date *</label><input type="date" id="expDate" value="' + new Date().toISOString().split('T')[0] + '"></div>';
  html += '<div class="ss-form-group"><label>Description</label><textarea id="expDesc" rows="2" placeholder="Brief description..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  // Line items
  html += '<div class="ss-form-group"><label style="font-weight:600;margin-bottom:6px">Expense Line Items</label>';
  html += '<div id="expLineItems"><div class="exp-line-item" style="display:flex;gap:6px;margin-bottom:6px"><input type="text" class="exp-item-desc" placeholder="Description" style="flex:2;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem"><input type="number" class="exp-item-amt" placeholder="Amount" style="flex:1;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem"></div></div>';
  html += '<button type="button" class="nf-btn nf-btn-outline nf-btn-sm" onclick="addExpenseLineItem()" style="margin-top:4px;font-size:.72rem">+ Add Item</button></div>';
  // Mandatory bill
  html += '<div class="ss-form-group"><label style="font-weight:600;color:var(--danger)">ATTACH BILL (REQUIRED) *</label>';
  html += '<div class="camera-zone" onclick="document.getElementById(\'expBillInput\').click()" style="padding:12px;margin-top:4px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  html += '<p style="font-size:.72rem;margin-top:4px">Tap to upload bill / receipt</p>';
  html += '<input type="file" id="expBillInput" accept="image/*" style="display:none" onchange="handleExpBillPreview(this)"></div>';
  html += '<div id="expBillPreview" style="display:none;margin-top:6px"><img style="max-width:100%;border-radius:var(--radius-xs)"></div></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="previewExpenseClaim()">Preview Claim</button><button class="nf-btn nf-btn-outline" onclick="renderExpenseOverlay()">Cancel</button></div></div>';
  c.innerHTML = html;
}

function previewExpenseClaim() {
  var cat = (document.getElementById('expCategory') || {}).value;
  var amount = parseFloat((document.getElementById('expAmount') || {}).value);
  var desc = (document.getElementById('expDesc') || {}).value.trim();
  var date = (document.getElementById('expDate') || {}).value;
  var advAmt = parseFloat((document.getElementById('expAdvanceAmt') || {}).value) || 0;
  var billInput = document.getElementById('expBillInput');

  if (!cat) { showToast('Please select a category'); return; }
  if (!amount || isNaN(amount)) { showToast('Please enter the amount spent'); return; }
  if (!date) { showToast('Please select a date'); return; }

  // Collect line items
  var lineItems = [];
  document.querySelectorAll('.exp-line-item').forEach(function(row) {
    var d = (row.querySelector('.exp-item-desc') || {}).value || '';
    var a = parseFloat((row.querySelector('.exp-item-amt') || {}).value) || 0;
    if (d.trim() || a > 0) lineItems.push({ desc: d.trim(), amt: a });
  });

  // Get bill preview image
  var billPreviewSrc = '';
  var billFileName = '';
  var previewImg = document.querySelector('#expBillPreview img');
  if (previewImg && previewImg.src) billPreviewSrc = previewImg.src;
  if (billInput && billInput.files && billInput.files[0]) billFileName = billInput.files[0].name;

  // Store form data + file before preview replaces HTML
  var billFile = (billInput && billInput.files && billInput.files[0]) ? billInput.files[0] : null;
  window._expPreviewData = { cat: cat, amount: amount, desc: desc, date: date, advAmt: advAmt, lineItems: lineItems, billFile: billFile };

  // Build preview HTML
  var c = document.getElementById('expensesContent');
  if (!c) return;

  var catIcons = {'Travel':'\uD83D\uDE97','Food':'\uD83C\uDF7D\uFE0F','Accommodation':'\uD83C\uDFE8','Equipment':'\uD83D\uDD27','Office Supplies':'\uD83D\uDCCE','Medical':'\uD83C\uDFE5','Fuel':'\u26FD','Other':'\uD83D\uDCE6'};
  var dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  var balance = amount - advAmt;

  var html = '<div class="card" style="margin-bottom:12px">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><div style="width:36px;height:36px;border-radius:10px;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:1.2rem">' + (catIcons[cat] || '\uD83D\uDCE6') + '</div>';
  html += '<div><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin:0">Preview Expense Claim</h3>';
  html += '<p style="font-size:.7rem;color:var(--gray-400);margin:0">Review details before submitting</p></div></div>';

  html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:12px;margin-bottom:12px">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.78rem">';
  html += '<div><span style="color:var(--gray-500)">Category:</span><br><strong>' + escapeHTML(cat) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Date:</span><br><strong>' + escapeHTML(dateLabel) + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Amount Spent:</span><br><strong style="color:var(--danger);font-size:.88rem">Rs.' + amount.toLocaleString('en-IN') + '</strong></div>';
  html += '<div><span style="color:var(--gray-500)">Advance Received:</span><br><strong>Rs.' + advAmt.toLocaleString('en-IN') + '</strong></div>';
  html += '</div>';
  if (balance > 0) {
    html += '<div style="margin-top:8px;padding:6px 10px;background:var(--warning-light,#fef3c7);border-radius:var(--radius-xs);font-size:.75rem"><strong>Balance to claim: Rs.' + balance.toLocaleString('en-IN') + '</strong></div>';
  }
  html += '</div>';

  if (desc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">DESCRIPTION</div>';
    html += '<div style="font-size:.78rem;padding:8px;background:var(--gray-50);border-radius:var(--radius-xs)">' + escapeHTML(desc) + '</div></div>';
  }

  if (lineItems.length > 0) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">LINE ITEMS</div>';
    html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);overflow:hidden">';
    var lineTotal = 0;
    lineItems.forEach(function(item) {
      lineTotal += item.amt;
      html += '<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--gray-100);font-size:.78rem"><span>' + escapeHTML(item.desc || 'Item') + '</span><strong>Rs.' + item.amt.toLocaleString('en-IN') + '</strong></div>';
    });
    html += '<div style="display:flex;justify-content:space-between;padding:8px 10px;font-size:.78rem;font-weight:700;background:var(--gray-100)"><span>Total</span><span>Rs.' + lineTotal.toLocaleString('en-IN') + '</span></div>';
    html += '</div></div>';
  }

  if (billPreviewSrc) {
    html += '<div style="margin-bottom:12px"><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;margin-bottom:4px">ATTACHED BILL' + (billFileName ? ' — ' + escapeHTML(billFileName) : '') + '</div>';
    html += '<div style="background:var(--gray-50);border-radius:var(--radius-xs);padding:8px;text-align:center"><img src="' + billPreviewSrc + '" style="max-width:100%;max-height:300px;border-radius:var(--radius-xs)"></div></div>';
  } else {
    html += '<div style="margin-bottom:12px;padding:8px 10px;background:#fee2e2;border-radius:var(--radius-xs);font-size:.75rem;color:#dc2626;font-weight:600">No bill attached</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:14px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="submitExpenseReimbursement()" style="flex:1;font-weight:700">Confirm & Submit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="openExpenseApplyForm()" style="flex:1">Edit</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="renderExpenseOverlay()">Cancel</button>';
  html += '</div></div>';
  c.innerHTML = html;
}

function addExpenseLineItem() {
  var container = document.getElementById('expLineItems');
  if (!container) return;
  var div = document.createElement('div');
  div.className = 'exp-line-item';
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px';
  div.innerHTML = '<input type="text" class="exp-item-desc" placeholder="Description" style="flex:2;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem"><input type="number" class="exp-item-amt" placeholder="Amount" style="flex:1;padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.78rem"><button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1rem">&times;</button>';
  container.appendChild(div);
}

function handleExpBillPreview(input) {
  handleBillPreview(input, 'expBillPreview');
}
function handleBillPreview(input, previewId) {
  if (input.files && input.files[0]) {
    var file = input.files[0];
    var preview = document.getElementById(previewId);
    if (!preview) return;
    if (file.type && file.type.indexOf('image') !== -1) {
      var reader = new FileReader();
      reader.onload = function(e) {
        preview.style.display = 'block';
        preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%;max-height:200px;border-radius:var(--radius-xs)">';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'block';
      preview.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:8px;background:var(--gray-50);border-radius:var(--radius-xs);font-size:.78rem"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' + escapeHTML(file.name) + '</div>';
    }
  }
}

// =====================================================
// F3: SELF SERVICE FUNCTIONS
// =====================================================
const MANDATORY_DOCS = [
  { key: 'aadhaar', label: 'Aadhaar Card' },
  { key: 'pan', label: 'PAN Card' },
  { key: 'resume', label: 'Resume' },
  { key: 'education', label: 'Educational Certificate' },
  { key: 'experience', label: 'Experience Certificate' }
];
function migrateSelfData(data) {
  // Migrate old uploadedDocs[] array to new documents{} map
  if (data && data.uploadedDocs && !data.documents) {
    data.documents = { aadhaar: null, pan: null, resume: null, education: null, experience: null };
    var keyMap = { 'Aadhaar Card': 'aadhaar', 'PAN Card': 'pan', 'Resume': 'resume', 'Education Certificate': 'education', 'Educational Certificate': 'education', 'Experience Letter': 'experience', 'Experience Certificate': 'experience' };
    data.uploadedDocs.forEach(function(d) {
      var k = keyMap[d.type || d.name];
      if (k && !data.documents[k]) data.documents[k] = { name: d.name, date: d.date };
    });
    delete data.uploadedDocs;
  }
  if (data && !data.documents) {
    data.documents = { aadhaar: null, pan: null, resume: null, education: null, experience: null };
  }
  return data;
}
function ensureSelfData(code) {
  var emp = EMPLOYEES.find(function(e) { return e.code === code; }) || {};
  if (!emp.documents) emp.documents = { aadhaar: null, pan: null, resume: null, education: null, experience: null };
  return emp;
}
function updatePersonalDetails() {
  var phoneEl = document.getElementById('ssPhone');
  var dobEl = document.getElementById('ssDob');
  var presentAddrEl = document.getElementById('ssPresentAddress');
  var permanentAddrEl = document.getElementById('ssPermanentAddress');
  var sameAddrEl = document.getElementById('ssSameAddress');
  var fatherNameEl = document.getElementById('ssFatherName');
  var fatherMobileEl = document.getElementById('ssFatherMobile');
  var motherNameEl = document.getElementById('ssMotherName');
  var motherMobileEl = document.getElementById('ssMotherMobile');
  var spouseNameEl = document.getElementById('ssSpouseName');
  var spouseMobileEl = document.getElementById('ssSpouseMobile');
  var bloodGroupEl = document.getElementById('ssBloodGroup');
  var maritalEl = document.getElementById('ssMaritalStatus');
  var qualEl = document.getElementById('ssQualification');
  var instEl = document.getElementById('ssInstitution');
  var yopEl = document.getElementById('ssYearOfPassing');
  var prevEmpEl = document.getElementById('ssPrevEmployer');
  var prevRoleEl = document.getElementById('ssPrevRole');
  var yoeEl = document.getElementById('ssYearsExp');
  if (!phoneEl) { showToast('Error: form not found'); return; }
  var payload = {
    phone: phoneEl.value.trim(),
    dob: dobEl ? dobEl.value : '',
    presentAddress: presentAddrEl ? presentAddrEl.value.trim() : '',
    permanentAddress: permanentAddrEl ? permanentAddrEl.value.trim() : '',
    fatherName: fatherNameEl ? fatherNameEl.value.trim() : '',
    fatherMobile: fatherMobileEl ? fatherMobileEl.value.trim() : '',
    motherName: motherNameEl ? motherNameEl.value.trim() : '',
    motherMobile: motherMobileEl ? motherMobileEl.value.trim() : '',
    spouseName: spouseNameEl ? spouseNameEl.value.trim() : '',
    spouseMobile: spouseMobileEl ? spouseMobileEl.value.trim() : '',
    bloodGroup: bloodGroupEl ? bloodGroupEl.value : '',
    maritalStatus: maritalEl ? maritalEl.value : '',
    qualification: qualEl ? qualEl.value.trim() : '',
    institution: instEl ? instEl.value.trim() : '',
    yearOfPassing: yopEl ? yopEl.value.trim() : '',
    previousEmployer: prevEmpEl ? prevEmpEl.value.trim() : '',
    previousRole: prevRoleEl ? prevRoleEl.value.trim() : '',
    yearsOfExperience: yoeEl ? yoeEl.value : ''
  };
  // Update local employee record
  var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; });
  if (emp) {
    Object.keys(payload).forEach(function(k) { emp[k] = payload[k]; });
    currentUser = Object.assign({}, currentUser, payload);
  }
  // Call self-update endpoint
  apiCall('PUT', '/employees/' + currentUser.code + '/self', payload).catch(function(){});
  showToast('Personal details saved successfully');
  var btn = document.querySelector('#selfServiceContent .ss-save-btn');
  if (btn) { btn.textContent = 'Saved ✓'; btn.style.background = 'var(--success)'; setTimeout(function() { btn.textContent = 'Save Changes'; btn.style.background = ''; }, 1500); }
}
function handleSameAddress() {
  var cb = document.getElementById('ssSameAddress');
  var permEl = document.getElementById('ssPermanentAddress');
  if (cb && permEl) {
    if (cb.checked) {
      var presEl = document.getElementById('ssPresentAddress');
      permEl.value = presEl ? presEl.value : '';
      permEl.disabled = true;
    } else {
      permEl.disabled = false;
    }
  }
}
function renderSelfServiceOverlay() {
  var c = document.getElementById('selfServiceContent');
  if (!c || !currentUser) return;
  var selfData = ensureSelfData(currentUser.code);
  var emp = EMPLOYEES.find(function(e) { return e.code === currentUser.code; }) || currentUser;
  var isHrMd = currentUser.role === 'MD' || currentUser.role === 'HR';
  var html = '';

  // Section 1: Profile Header Card
  var statusClass = emp.status === 'Active' ? 'badge-approved' : 'badge-rejected';
  html += '<div class="card" style="margin-bottom:12px">';
  html += '<div style="display:flex;gap:14px;align-items:center">';
  html += '<div class="avatar-sm" style="width:56px;height:56px;font-size:1.2rem;flex-shrink:0">' + escapeHTML(emp.name.charAt(0)) + '</div>';
  html += '<div style="flex:1"><div style="font-weight:700;font-size:1rem">' + escapeHTML(emp.name) + '</div>';
  html += '<div style="font-size:.78rem;color:var(--gray-500)">' + escapeHTML(emp.code) + ' &middot; ' + escapeHTML(emp.designation || 'Employee') + '</div>';
  html += '<div style="font-size:.72rem;color:var(--gray-400);margin-top:2px">' + escapeHTML(emp.dept) + (emp.doj ? ' &middot; Joined ' + escapeHTML(emp.doj) : '') + '</div>';
  html += '</div>';
  html += '<span class="badge-status ' + statusClass + '" style="align-self:flex-start">' + escapeHTML(emp.status || 'Active') + '</span>';
  html += '</div></div>';

  // Section 2: Personal Information (editable)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Personal Information</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Date of Birth</label><input type="date" id="ssDob" value="' + escapeHTML(emp.dob || '') + '"></div>';
  html += '<div class="ss-form-group"><label>Phone</label><input type="tel" id="ssPhone" value="' + escapeHTML(emp.phone || '') + '" placeholder="Mobile number"></div>';
  html += '<div class="ss-form-group"><label>Email</label><div class="ss-readonly">' + escapeHTML(emp.email || 'Not set') + '</div></div>';
  html += '<div class="ss-form-group"><label>Blood Group</label><select class="nf-select" id="ssBloodGroup">';
  var bgs = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  bgs.forEach(function(bg) { html += '<option value="' + bg + '"' + (emp.bloodGroup === bg ? ' selected' : '') + '>' + (bg || 'Select') + '</option>'; });
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Marital Status</label><select class="nf-select" id="ssMaritalStatus">';
  var ms = ['', 'Single', 'Married', 'Divorced', 'Widowed'];
  ms.forEach(function(s) { html += '<option value="' + s + '"' + (emp.maritalStatus === s ? ' selected' : '') + '>' + (s || 'Select') + '</option>'; });
  html += '</select></div>';
  html += '</div></div>';

  // Section 3: Address (editable)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Address</div>';
  html += '<div class="ss-form-group"><label>Present Address</label><textarea id="ssPresentAddress" rows="2" placeholder="Current residential address">' + escapeHTML(emp.presentAddress || selfData.presentAddress || '') + '</textarea></div>';
  html += '<div class="ss-form-group"><label style="display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:.78rem"><input type="checkbox" id="ssSameAddress" onchange="handleSameAddress()"' + (selfData.sameAddress ? ' checked' : '') + '> Same as present address</label></div>';
  html += '<div class="ss-form-group"><label>Permanent Address</label><textarea id="ssPermanentAddress" rows="2" placeholder="Permanent address"' + (selfData.sameAddress ? ' disabled' : '') + '>' + escapeHTML(emp.permanentAddress || selfData.permanentAddress || '') + '</textarea></div>';
  html += '</div>';

  // Section 4: Emergency Contacts (editable)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Emergency Contacts</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Father Name</label><input type="text" id="ssFatherName" value="' + escapeHTML(emp.fatherName || '') + '" placeholder="Father name"></div>';
  html += '<div class="ss-form-group"><label>Father Mobile</label><input type="tel" id="ssFatherMobile" value="' + escapeHTML(emp.fatherMobile || '') + '" placeholder="Mobile"></div>';
  html += '<div class="ss-form-group"><label>Mother Name</label><input type="text" id="ssMotherName" value="' + escapeHTML(emp.motherName || '') + '" placeholder="Mother name"></div>';
  html += '<div class="ss-form-group"><label>Mother Mobile</label><input type="tel" id="ssMotherMobile" value="' + escapeHTML(emp.motherMobile || '') + '" placeholder="Mobile"></div>';
  html += '<div class="ss-form-group"><label>Spouse Name</label><input type="text" id="ssSpouseName" value="' + escapeHTML(emp.spouseName || '') + '" placeholder="Spouse name (optional)"></div>';
  html += '<div class="ss-form-group"><label>Spouse Mobile</label><input type="tel" id="ssSpouseMobile" value="' + escapeHTML(emp.spouseMobile || '') + '" placeholder="Mobile (optional)"></div>';
  html += '</div></div>';

  // Section 5: Official Details (read-only)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Official Details <span class="ss-info-badge">Contact HR to update</span></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Designation</label><div class="ss-readonly">' + escapeHTML(emp.designation || '-') + '</div></div>';
  html += '<div class="ss-form-group"><label>Department</label><div class="ss-readonly">' + escapeHTML(emp.dept || '-') + '</div></div>';
  html += '<div class="ss-form-group"><label>Date of Joining</label><div class="ss-readonly">' + escapeHTML(emp.doj || '-') + '</div></div>';
  var salaryDisplay = isHrMd ? ('Rs.' + (emp.salary || 0).toLocaleString('en-IN')) : 'Rs.XX,XXX';
  html += '<div class="ss-form-group"><label>Salary</label><div class="ss-readonly">' + escapeHTML(salaryDisplay) + '</div></div>';
  html += '</div></div>';

  // Section 6: Bank & Financial (read-only)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Bank & Financial <span class="ss-info-badge">Contact HR to update</span></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Bank Name</label><div class="ss-readonly">' + escapeHTML(emp.bank || '-') + '</div></div>';
  var accDisplay = emp.accNo ? (isHrMd ? emp.accNo : emp.accNo.replace(/.(?=.{4})/g, 'X')) : '-';
  html += '<div class="ss-form-group"><label>Account Number</label><div class="ss-readonly">' + escapeHTML(accDisplay) + '</div></div>';
  html += '<div class="ss-form-group"><label>PAN</label><div class="ss-readonly">' + escapeHTML(emp.pan || '-') + '</div></div>';
  html += '<div class="ss-form-group"><label>UAN</label><div class="ss-readonly">' + escapeHTML(emp.uan || '-') + '</div></div>';
  var aadhaarDisplay = emp.aadhaar ? (isHrMd ? emp.aadhaar : emp.aadhaar.replace(/.(?=.{4})/g, 'X')) : '-';
  html += '<div class="ss-form-group"><label>Aadhaar</label><div class="ss-readonly">' + escapeHTML(aadhaarDisplay) + '</div></div>';
  html += '</div></div>';

  // Section 7: Qualification & Experience (editable)
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Qualification & Experience</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="ss-form-group"><label>Qualification</label><input type="text" id="ssQualification" value="' + escapeHTML(emp.qualification || '') + '" placeholder="e.g. B.E Civil"></div>';
  html += '<div class="ss-form-group"><label>Institution</label><input type="text" id="ssInstitution" value="' + escapeHTML(emp.institution || '') + '" placeholder="College / University"></div>';
  html += '<div class="ss-form-group"><label>Year of Passing</label><input type="text" id="ssYearOfPassing" value="' + escapeHTML(emp.yearOfPassing || '') + '" placeholder="e.g. 2020"></div>';
  html += '<div class="ss-form-group"><label>Years of Experience</label><input type="number" id="ssYearsExp" value="' + escapeHTML(String(emp.yearsOfExperience || '')) + '" placeholder="e.g. 5" step="0.5" min="0"></div>';
  html += '<div class="ss-form-group"><label>Previous Employer</label><input type="text" id="ssPrevEmployer" value="' + escapeHTML(emp.previousEmployer || '') + '" placeholder="Last company name"></div>';
  html += '<div class="ss-form-group"><label>Previous Role</label><input type="text" id="ssPrevRole" value="' + escapeHTML(emp.previousRole || '') + '" placeholder="Last designation"></div>';
  html += '</div>';
  html += '<button class="nf-btn nf-btn-primary ss-save-btn" style="margin-top:8px" onclick="updatePersonalDetails()">Save Changes</button></div>';

  // Section 8: Mandatory Documents (existing)
  var docs = selfData.documents || {};
  var uploadedCount = MANDATORY_DOCS.filter(function(d) { return docs[d.key]; }).length;
  html += '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Mandatory Documents</div>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:.78rem;color:var(--gray-500)">' + uploadedCount + '/' + MANDATORY_DOCS.length + ' documents uploaded</span>';
  if (uploadedCount === MANDATORY_DOCS.length) html += '<span class="ss-doc-uploaded">All Complete</span>';
  else html += '<span class="ss-doc-required">' + (MANDATORY_DOCS.length - uploadedCount) + ' remaining</span>';
  html += '</div>';
  html += '<div class="ss-completion-bar"><div class="ss-completion-fill" style="width:' + (uploadedCount / MANDATORY_DOCS.length * 100) + '%"></div></div>';
  MANDATORY_DOCS.forEach(function(doc) {
    var uploaded = docs[doc.key];
    html += '<div class="ss-doc-row">';
    html += '<div><div style="font-weight:600;font-size:.82rem">' + escapeHTML(doc.label) + '</div>';
    if (uploaded) {
      html += '<div style="font-size:.7rem;color:var(--gray-500)">' + escapeHTML(uploaded.name) + ' &middot; ' + uploaded.date + '</div>';
    }
    html += '</div><div style="display:flex;align-items:center;gap:8px">';
    if (uploaded) {
      html += '<span class="ss-doc-uploaded">Uploaded &#10003;</span>';
      html += '<button class="nf-btn nf-btn-outline nf-btn-sm" onclick="uploadMandatoryDoc(\'' + doc.key + '\',\'' + escapeHTML(doc.label) + '\')">Re-upload</button>';
    } else {
      html += '<span class="ss-doc-required">Required</span>';
      html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="uploadMandatoryDoc(\'' + doc.key + '\',\'' + escapeHTML(doc.label) + '\')">Upload</button>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  c.innerHTML = html;
}
function uploadMandatoryDoc(docKey, docLabel) {
  // Create a hidden file input and trigger it
  var existingInput = document.getElementById('ssMandatoryFileInput');
  if (existingInput) existingInput.remove();
  var input = document.createElement('input');
  input.type = 'file';
  input.id = 'ssMandatoryFileInput';
  input.accept = '.pdf,.jpg,.jpeg,.png';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = function() {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var selfData = ensureSelfData(currentUser.code);
    selfData.documents[docKey] = { name: file.name, date: new Date().toISOString().split('T')[0] };
    // Try backend upload
    var formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docLabel);
    formData.append('empCode', currentUser.code);
    apiCall('POST', '/documents/upload', formData).catch(function(){});
    showToast(escapeHTML(docLabel) + ' uploaded successfully');
    renderSelfServiceOverlay();
    input.remove();
  };
  input.click();
}

// =====================================================
// F4: GEO-FENCED ATTENDANCE FUNCTIONS
// =====================================================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function checkGeofence(lat, lng) {
  const sites = (typeof siteLocations !== 'undefined' && Array.isArray(siteLocations)) ? siteLocations : SITE_LOCATIONS;
  for (const loc of sites) {
    const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (dist <= loc.radius) return { inside: true, location: loc.name, distance: Math.round(dist) };
  }
  return { inside: false, location: null, distance: null };
}
var _lastGeoPos = null;
function getGeofenceStatusHTML() {
  // Use warm-cached position if available (from GPS pre-warm)
  if (_gpsWarmPos && (Date.now() - _gpsWarmTs) < 60000) {
    _lastGeoPos = { lat: _gpsWarmPos.coords.latitude, lng: _gpsWarmPos.coords.longitude };
  }
  if (_lastGeoPos) {
    var result = checkGeofence(_lastGeoPos.lat, _lastGeoPos.lng);
    if (result.inside) return '<span class="geofence-status geofence-inside">\ud83d\udccd ' + escapeHTML(result.location) + ' (' + result.distance + 'm)</span>';
    return '<span class="geofence-status geofence-outside">\u26a0 Outside geofence</span>';
  }
  // Request GPS and update when available — use fast network fix
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      _lastGeoPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      var el = document.getElementById('geofenceStatusContainer');
      if (el) {
        var r = checkGeofence(_lastGeoPos.lat, _lastGeoPos.lng);
        el.innerHTML = r.inside
          ? '<span class="geofence-status geofence-inside">\ud83d\udccd ' + escapeHTML(r.location) + ' (' + r.distance + 'm)</span>'
          : '<span class="geofence-status geofence-outside">\u26a0 Outside geofence</span>';
      }
    }, function() {
      var el = document.getElementById('geofenceStatusContainer');
      if (el) el.innerHTML = '<span class="geofence-status geofence-outside">\u26a0 Location unavailable</span>';
    }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 15000 });
  }
  return '<span id="geofenceStatusContainer"><span class="geofence-status" style="opacity:.6">\u23f3 Detecting location...</span></span>';
}
function getAttendanceStatus(checkInTime) {
  // Only show Present status — no Late/On-time distinction per user request
  if (!checkInTime) return '';
  return '<span style="font-size:.7rem;color:var(--success)"> (Present)</span>';
}
function renderAttendanceLogOverlay() {
  const c = document.getElementById('attendanceLogContent');
  if (!c || !currentUser) return;
  const logs = (typeof attendanceLogs !== 'undefined' ? attendanceLogs : []).filter(l => l.empCode === currentUser.code);
  let html = '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Geofence Status</div>' + getGeofenceStatusHTML() + '</div>';
  html += '<div class="card"><div class="nf-section-title">Recent Attendance</div>';
  if (logs.length === 0) {
    html += '<div class="nf-empty">No attendance logs found</div>';
  } else {
    logs.slice(-15).reverse().forEach(log => {
      const status = getAttendanceStatus(log.checkIn);
      html += `<div class="attendance-log-item"><div class="log-time">${log.checkIn||'--:--'}</div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${log.date}</div><div style="font-size:.72rem;color:var(--gray-500)">${log.location||'Office'}</div></div><div style="text-align:right"><span class="badge-status ${log.checkOut?'badge-approved':'badge-pending'}">${log.checkOut?'Completed':'Active'}</span>${status}</div></div>`;
    });
  }
  html += '</div>';
  c.innerHTML = html;
}

// =====================================================
// ATTENDANCE LOG LIST (below calendar)
// =====================================================
function renderAttendanceLogList() {
  var c = document.getElementById('attendanceLogList');
  if (!c || !currentUser) return;
  var myLogs = (typeof attendanceLogs !== 'undefined' ? attendanceLogs : []).filter(function(l) { return l.empCode === currentUser.code; });
  if (myLogs.length === 0) {
    c.innerHTML = '<div style="padding:16px;text-align:center;color:var(--gray-400);font-size:.8rem">No attendance records yet. Use GPS Check-In to start logging.</div>';
    return;
  }
  // Group by date — use checkIn/checkOut fields directly (not type)
  var byDate = {};
  myLogs.forEach(function(log) {
    var d = log.logDate ? String(log.logDate).substring(0, 10) : (log.timestamp ? log.timestamp.split('T')[0] : 'unknown');
    if (!byDate[d]) byDate[d] = { checkin: null, checkout: null, log: null };
    // Each attendance record has both checkIn and checkOut fields
    if (log.checkIn && !byDate[d].checkin) byDate[d].checkin = log;
    if (log.checkOut) byDate[d].checkout = log;
    if (!byDate[d].log) byDate[d].log = log;
  });
  var dates = Object.keys(byDate).sort().reverse().slice(0, 30);
  var html = '<div style="padding:12px">';
  dates.forEach(function(dt) {
    var pair = byDate[dt];
    var theLog = pair.checkin || pair.checkout || pair.log;
    var ciTime = theLog && theLog.checkIn ? new Date(theLog.checkIn).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}) : '--:--';
    var coLog = pair.checkout || theLog;
    var hasRealCheckout = !!(coLog && coLog.checkOut);
    var coTime = hasRealCheckout ? new Date(coLog.checkOut).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}) : '--:--';
    var loc = (theLog && theLog.location) ? theLog.location : 'Unknown';
    var duration = '';
    var isToday = (dt === new Date().toISOString().split('T')[0]);
    if (theLog && theLog.checkIn) {
      if (hasRealCheckout) {
        var diff = (new Date(coLog.checkOut) - new Date(theLog.checkIn)) / 60000;
        // Cap displayed duration at 8h to match calendar logic
        if (diff > 480) diff = 480;
        if (diff > 0) { var hrs = Math.floor(diff / 60), mins = Math.round(diff % 60); duration = hrs + 'h ' + mins + 'm'; }
      } else if (!isToday) {
        // Past day with no checkout — show 8h (auto-closed by server cron)
        duration = '8h 0m';
        coTime = 'auto-closed';
      }
    }
    var statusHtml = '';
    if (theLog && theLog.checkIn) {
      statusHtml = '<span style="font-size:.65rem;color:var(--success);font-weight:600">Present</span>';
    }
    var dateLabel = new Date(dt + 'T00:00:00').toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric',weekday:'short'});
    html += '<div class="attendance-log-row" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">';
    html += '<div style="min-width:80px"><div style="font-weight:600;font-size:.78rem">' + escapeHTML(dateLabel.split(',')[1] || dateLabel) + '</div><div style="font-size:.65rem;color:var(--gray-400)">' + escapeHTML(dateLabel.split(',')[0] || '') + '</div></div>';
    html += '<div style="flex:1;display:flex;flex-direction:column;gap:2px">';
    html += '<div style="font-size:.75rem"><span style="color:var(--success)">In:</span> ' + escapeHTML(ciTime) + ' <span style="color:var(--danger);margin-left:6px">Out:</span> ' + escapeHTML(coTime) + '</div>';
    html += '<div style="font-size:.68rem;color:var(--gray-500)">' + escapeHTML(loc) + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;min-width:50px">' + (duration ? '<div style="font-size:.72rem;font-weight:600">' + escapeHTML(duration) + '</div>' : '<span class="badge-status badge-pending" style="font-size:.6rem">Active</span>') + statusHtml + '</div>';
    html += '</div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

// =====================================================
// HOME: MY TASKS & MY PROJECTS
// =====================================================
function renderHomeTasks() {
  var c = document.getElementById('homeMyTasks');
  if (!c || !currentUser) return;
  var myTasks = TASK_DATA.filter(function(t) {
    if (t.assignedTo === 'ALL') return true;
    if (t.assignedTo === currentUser.dept) return true;
    if (t.assignedTo === currentUser.code) return true;
    return false;
  });
  if (myTasks.length === 0) { c.innerHTML = ''; return; }
  var priorityColors = {urgent:'var(--danger)',high:'var(--warning)',normal:'var(--primary)',low:'var(--gray-400)'};
  var html = '<div class="section-title">My Tasks</div>';
  myTasks.slice(0, 5).forEach(function(t) {
    var pColor = priorityColors[t.priority] || 'var(--primary)';
    var statusLabel = t.done ? 'Done' : 'Pending';
    var statusCls = t.done ? 'badge-approved' : 'badge-pending';
    html += '<div class="home-task-card fade-in" onclick="showOverlay(\'hr-tasks\')">';
    html += '<div class="home-task-priority" style="background:' + pColor + '"></div>';
    html += '<div class="home-task-info"><h4>' + escapeHTML(t.title) + '</h4>';
    html += '<p>' + escapeHTML(t.type) + ' &middot; Due: ' + escapeHTML(t.dueDate) + '</p></div>';
    html += '<span class="badge-status ' + statusCls + '">' + statusLabel + '</span>';
    html += '</div>';
  });
  c.innerHTML = html;
}

function renderHomeProjects() {
  var c = document.getElementById('homeMyProjects');
  if (!c || !currentUser) return;
  var myProjects = projects.filter(function(p) {
    return p.team && p.team.indexOf(currentUser.code) !== -1;
  });
  if (myProjects.length === 0) { c.innerHTML = ''; return; }
  var html = '<div class="section-title">My Projects</div>';
  myProjects.forEach(function(p) {
    var pct = getProjectProgress(p);
    var barColor = p.status === 'Completed' ? 'var(--success)' : p.status === 'Delayed' ? 'var(--warning)' : 'var(--primary)';
    html += '<div class="home-project-card fade-in" onclick="showProjectDetail(' + p.id + ')">';
    html += '<div class="home-project-header"><h4>' + escapeHTML(p.name) + '</h4><span class="badge-status ' + (p.status === 'Completed' ? 'badge-approved' : 'badge-open') + '">' + escapeHTML(p.status) + '</span></div>';
    html += '<div class="progress-bar-bg" style="height:6px;margin:6px 0"><div class="progress-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div>';
    html += '<div style="font-size:.72rem;color:var(--gray-500)">' + pct + '% &middot; ' + p.tasks.filter(function(t){return t.status==="Done";}).length + '/' + p.tasks.length + ' tasks</div>';
    html += '</div>';
  });
  c.innerHTML = html;
}

// =====================================================
// RECENT ACTIVITY (role-filtered, live from DB + local)
// =====================================================
function renderRecentActivity() {
  var c = document.getElementById('recentActivityList');
  if (!c || !currentUser) return;

  // Show loading only on first render
  if (!c.dataset.loaded) {
    c.innerHTML = '<div style="padding:12px;text-align:center;color:var(--gray-400);font-size:.75rem">Loading activity...</div>';
  }

  // Fetch fresh data from DB
  Promise.all([
    apiCall('GET', '/leaves').catch(function() { return []; }),
    apiCall('GET', '/advances').catch(function() { return []; }),
    apiCall('GET', '/notifications?limit=10').catch(function() { return []; }),
    apiCall('GET', '/attendance/today').catch(function() { return { sessions: [] }; })
  ]).then(function(results) {
    var dbLeaves = Array.isArray(results[0]) ? results[0] : (results[0] && results[0].data ? results[0].data : []);
    var dbAdvances = Array.isArray(results[1]) ? results[1] : (results[1] && results[1].data ? results[1].data : []);
    var dbNotifs = Array.isArray(results[2]) ? results[2] : [];
    var todaySessions = results[3] && results[3].sessions ? results[3].sessions : [];

    var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';
    var items = [];

    // DB Leave applications
    dbLeaves.slice(0, 8).forEach(function(l) {
      items.push({
        icon: '<div class="req-icon" style="background:#DBEAFE;color:#2563EB"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div>',
        title: escapeHTML((l.leave_type || l.type || 'Leave') + (isMDorHR && l.emp_name ? ' — ' + l.emp_name : '')),
        sub: escapeHTML((l.from_date || l.from || '') + ' to ' + (l.to_date || l.to || '')) + ' &middot; ' + (l.days || 1) + ' day(s)',
        date: l.created_at || l.from_date || '',
        status: l.status || 'pending',
        sortDate: l.created_at || ''
      });
    });

    // DB Advance requests
    dbAdvances.slice(0, 5).forEach(function(r) {
      items.push({
        icon: '<div class="req-icon" style="background:var(--teal-light,#CCFBF1);color:var(--teal-dark,#0F766E)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>',
        title: escapeHTML((r.type || 'Salary') + ' Advance' + (isMDorHR && r.emp_name ? ' — ' + r.emp_name : '')),
        sub: 'Rs.' + Number(r.amount || 0).toLocaleString('en-IN'),
        date: r.created_at || '',
        status: r.status || 'Pending',
        sortDate: r.created_at || ''
      });
    });

    // Today's attendance
    todaySessions.forEach(function(s) {
      if (s.check_in) {
        var time = new Date(s.check_in).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'});
        items.push({
          icon: '<div class="req-icon" style="background:var(--success-light,#DCFCE7);color:var(--success-dark,#15803D)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
          title: 'GPS Check-In',
          sub: escapeHTML(time + (s.location_name ? ' · ' + s.location_name : '')),
          date: 'Today', status: s.check_out ? 'Checked Out' : 'Checked In',
          sortDate: s.check_in || ''
        });
      }
    });

    // Also include local data that may not be in DB yet
    var localAdvReqs = (typeof advanceRequests !== 'undefined' ? advanceRequests : []);
    var filteredLocalAdv = isMDorHR ? localAdvReqs : localAdvReqs.filter(function(r) { return r.empCode === currentUser.code; });
    filteredLocalAdv.slice(-3).reverse().forEach(function(r) {
      // Skip if already in DB results
      if (dbAdvances.some(function(d) { return d.id === r.id; })) return;
      items.push({
        icon: '<div class="req-icon" style="background:var(--teal-light,#CCFBF1);color:var(--teal-dark,#0F766E)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>',
        title: escapeHTML((r.type || 'Salary') + ' Advance' + (isMDorHR && r.empName ? ' — ' + r.empName : '')),
        sub: 'Rs.' + (r.amount || 0).toLocaleString('en-IN'),
        date: r.date || '', status: r.status || 'Pending', sortDate: r.date || ''
      });
    });

    // Sort by date desc, limit to 8
    items.sort(function(a, b) { return (b.sortDate || '').localeCompare(a.sortDate || ''); });
    items = items.slice(0, 8);

    if (items.length === 0) {
      c.innerHTML = '<div style="padding:16px;text-align:center;color:var(--gray-400);font-size:.8rem">No recent activity</div>';
      c.dataset.loaded = '1';
      return;
    }

    var badgeClass = function(st) {
      var s = (st || '').toLowerCase();
      if (s === 'approved' || s === 'checked in' || s === 'checked out') return 'badge-approved';
      if (s === 'rejected') return 'badge-danger';
      if (s === 'hr_accepted') return 'badge-pending';
      if (s === 'paid' || s === 'active') return 'badge-paid';
      return 'badge-pending';
    };
    var statusLabel = function(st) {
      var map = { pending:'Pending', approved:'Approved', rejected:'Rejected', hr_accepted:'HR Accepted', Pending:'Pending', Approved:'Approved', HR_Accepted:'HR Accepted' };
      return map[st] || st || 'Pending';
    };

    var html = '<div class="section-title" style="margin-top:0">Recent Activity</div>';
    items.forEach(function(it) {
      var shortDate = it.date;
      if (shortDate && shortDate !== 'Today' && shortDate.length > 6) {
        try { shortDate = new Date(shortDate).toLocaleDateString('en-IN', {day:'2-digit',month:'short'}); } catch(e) {}
      }
      html += '<div class="request-item">' + it.icon;
      html += '<div class="req-info"><h4>' + it.title + '</h4><p>' + it.sub + '</p></div>';
      html += '<div class="req-meta"><div class="date">' + escapeHTML(shortDate) + '</div><span class="badge-status ' + badgeClass(it.status) + '">' + escapeHTML(statusLabel(it.status)) + '</span></div>';
      html += '</div>';
    });
    c.innerHTML = html;
    c.dataset.loaded = '1';
  });
}

// =====================================================
// HOME QUICK STATS (fills right column)
// =====================================================
function renderHomeQuickStats() {
  var c = document.getElementById('homeQuickStats');
  if (!c || !currentUser) return;

  var myLeaves = (typeof leaveApplications !== 'undefined' ? leaveApplications : []).filter(function(l) { return l.empCode === currentUser.code; });
  var myAdvances = (typeof advanceRequests !== 'undefined' ? advanceRequests : []).filter(function(r) { return r.empCode === currentUser.code; });

  // Leave balance
  var bal = (typeof leaveBalances !== 'undefined' && leaveBalances[currentUser.code]) ? leaveBalances[currentUser.code] : {};
  var casualLeft = bal.casual !== undefined ? bal.casual : 12;

  // Pending items
  var pendingLeaves = myLeaves.filter(function(l) { return l.status === 'pending' || l.status === 'hr_accepted'; }).length;
  var pendingAdv = myAdvances.filter(function(r) { var s = (r.status || '').toLowerCase(); return s === 'pending' || s === 'hr_accepted'; }).length;

  // Attendance this month
  var todayStr = new Date().toISOString().split('T')[0];
  var monthStr = todayStr.substring(0, 7);
  // Count unique attendance days (not by type — records with checkout still count)
  var myAttDays = {};
  (typeof attendanceLogs !== 'undefined' ? attendanceLogs : []).forEach(function(l) {
    if (l.empCode === currentUser.code && l.logDate && String(l.logDate).substring(0, 7) === monthStr) {
      myAttDays[String(l.logDate).substring(0, 10)] = true;
    }
  });
  var myAttendance = Object.keys(myAttDays).length;

  // Leave balance
  var compLeft = bal.comp !== undefined ? bal.comp : 3;
  var permLeft = bal.permission !== undefined ? bal.permission : 1;

  var html = '<div class="section-title" style="margin-top:4px">Quick Stats</div>';
  html += '<div class="home-quick-stats">';
  html += '<div class="home-stat-card stat-attendance"><div class="home-stat-value" style="color:var(--success)">' + myAttendance + '</div><div class="home-stat-label">Days Present</div></div>';
  html += '<div class="home-stat-card stat-advance"><div class="home-stat-value" style="color:var(--teal)">' + pendingAdv + '</div><div class="home-stat-label">Pending Advances</div></div>';
  html += '<div class="home-stat-card stat-expense"><div class="home-stat-value" style="color:var(--purple)">' + pendingLeaves + '</div><div class="home-stat-label">Pending Leaves</div></div>';
  html += '</div>';

  // Leave balance breakdown
  html += '<div class="section-title" style="margin-top:10px">Leave Balance</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  html += '<div class="home-stat-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--blue)">' + casualLeft + '</div><div style="font-size:.62rem;color:var(--gray-500)">Casual</div></div>';
  html += '<div class="home-stat-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--teal)">' + compLeft + '</div><div style="font-size:.62rem;color:var(--gray-500)">Comp Off</div></div>';
  html += '<div class="home-stat-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--warning-dark,#92400e)">' + permLeft + '</div><div style="font-size:.62rem;color:var(--gray-500)">Permission (2hr)</div></div>';
  html += '</div>';
  c.innerHTML = html;
}

// =====================================================
// ANALYTICS & REPORTS DASHBOARD (role-based charts)
// =====================================================
function loadChartJS(cb) {
  if (window.Chart) { cb(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
  s.onload = cb; document.head.appendChild(s);
}

function _chartCard(id, title, icon, height) {
  return '<div class="analytics-card"><div class="analytics-card-header">' +
    '<div class="analytics-card-icon">' + icon + '</div>' +
    '<h4 class="analytics-card-title">' + title + '</h4></div>' +
    '<div class="analytics-card-body"><canvas id="' + id + '" height="' + (height || 180) + '"></canvas></div></div>';
}

function renderHomeAnalytics() {
  var c = document.getElementById('homeAnalytics');
  if (!c || !currentUser) return;

  apiCall('GET', '/analytics/home').then(function(data) {
    var role = currentUser.role;

    // Section header
    var html = '<div class="analytics-section">';
    html += '<div class="analytics-header">';
    html += '<div><h3 class="analytics-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>Analytics & Reports</h3>';
    html += '<p class="analytics-subtitle">Real-time insights based on your role</p></div></div>';

    html += '<div class="analytics-grid">';

    // ── Employee/HR/Manager: My charts ──
    if (role !== 'MD') {
      html += _chartCard('chartMyAttendance', 'My Attendance This Month',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M9 16l2 2 4-4"/></svg>', 170);
      html += _chartCard('chartMyLeaves', 'My Leave Usage',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', 170);
    }

    // ── HR/Manager/MD: Team charts ──
    if (role === 'HR' || role === 'MD' || role === 'Manager') {
      html += _chartCard('chartAttendanceToday', "Today's Attendance",
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>', 170);
      html += _chartCard('chartDeptDist', 'Department Distribution',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/></svg>', 170);
      html += _chartCard('chartMonthlyAttendance', 'Monthly Attendance Trend',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', 170);
      html += _chartCard('chartLeaveStats', 'Leave Requests This Month',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>', 170);
    }

    // ── MD ONLY: Financial charts ──
    if (role === 'MD') {
      html += _chartCard('chartStockCategory', 'PEB Stock Value by Category',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e85d04" stroke-width="2"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/></svg>', 180);
      html += _chartCard('chartStockConsumption', 'Stock Consumption Trend',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', 180);
    }

    // Close the chart grid
    html += '</div>';

    // ── HR/MD: Attendance heatmap (below charts, full width) ──
    if ((role === 'HR' || role === 'MD') && data.topAbsentees && data.topAbsentees.length > 0) {
      var workDays = new Date().getDate();
      html += '<div class="analytics-card" style="margin-top:16px"><div class="analytics-card-header">' +
        '<div class="analytics-card-icon" style="background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04))"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
        '<h4 class="analytics-card-title">Attendance Heatmap — Least Present</h4></div>' +
        '<div class="analytics-card-body">';
      html += '<div style="overflow-x:auto"><table class="analytics-table">';
      html += '<thead><tr><th>Employee</th><th>Dept</th><th>Days Present</th><th>Attendance Rate</th></tr></thead><tbody>';
      data.topAbsentees.forEach(function(e) {
        var present = e.days_present || 0;
        var pct = workDays > 0 ? Math.round(present / workDays * 100) : 0;
        var barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
        var bgColor = pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fef2f2';
        html += '<tr><td><strong>' + escapeHTML(e.name) + '</strong> <span style="color:#9ca3af">(' + escapeHTML(e.code) + ')</span></td>';
        html += '<td>' + escapeHTML(e.dept || '-') + '</td>';
        html += '<td style="text-align:center"><span style="font-weight:700;color:' + barColor + '">' + present + '</span> / ' + workDays + '</td>';
        html += '<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:#f0f0f0;border-radius:6px;height:10px;min-width:80px;overflow:hidden"><div style="background:' + barColor + ';height:100%;border-radius:6px;width:' + pct + '%;transition:width .5s"></div></div><span style="font-size:.7rem;font-weight:600;color:' + barColor + ';min-width:35px;padding:2px 6px;background:' + bgColor + ';border-radius:4px;text-align:center">' + pct + '%</span></div></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    html += '</div>';
    c.innerHTML = html;

    // ── Render charts ──
    loadChartJS(function() {
      Chart.defaults.font.family = "'DM Sans', sans-serif";
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
      var palette = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#e85d04'];
      var gradientBlue, gradientRed;

      function makeGradient(ctx, color1, color2) {
        var g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        g.addColorStop(0, color1); g.addColorStop(1, color2); return g;
      }

      // My Attendance
      var myAtt = data.myAttendance || [];
      var a1 = document.getElementById('chartMyAttendance');
      if (a1 && myAtt.length > 0) {
        gradientBlue = makeGradient(a1.getContext('2d'), 'rgba(59,130,246,.8)', 'rgba(59,130,246,.2)');
        new Chart(a1, { type:'bar', data:{ labels:myAtt.map(function(d){return d.day?new Date(d.day).getDate()+'':'';}), datasets:[{label:'Sessions',data:myAtt.map(function(d){return d.sessions;}),backgroundColor:gradientBlue,borderRadius:6,borderSkipped:false}] },
          options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false}}}} });
      }

      // My Leaves
      var myLv = data.myLeaveUsage || [];
      var a2 = document.getElementById('chartMyLeaves');
      if (a2) {
        var lbl = myLv.length > 0 ? myLv.map(function(l){return l.leave_type||'Other';}) : ['Unused'];
        var vals = myLv.length > 0 ? myLv.map(function(l){return l.total_days||0;}) : [12];
        new Chart(a2, { type:'doughnut', data:{ labels:lbl, datasets:[{data:vals,backgroundColor:palette.slice(0,lbl.length),borderWidth:0,hoverOffset:6}] },
          options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:12}}}} });
      }

      // Today's attendance — with absent-employee hover tooltip for HR/MD
      var at = data.attendanceToday || {};
      var a3 = document.getElementById('chartAttendanceToday');
      if (a3) {
        var absentList = Array.isArray(at.absentList) ? at.absentList : [];
        var leaveList  = Array.isArray(at.leaveList)  ? at.leaveList  : [];
        // Build grouped-by-dept label lines for a tidy tooltip (max 20 rows + "+N more")
        function _buildLines(list, emptyMsg, withType) {
          if (list.length === 0) return [emptyMsg];
          var byDept = {};
          list.forEach(function(e){
            var label = e.name + ' (' + e.code + ')' + (withType && e.leave_type ? ' — ' + e.leave_type : '');
            (byDept[e.dept||'Other'] = byDept[e.dept||'Other'] || []).push(label);
          });
          var lines = [];
          Object.keys(byDept).sort().forEach(function(d){
            lines.push(d + ':');
            byDept[d].forEach(function(n){ lines.push('  • ' + n); });
          });
          if (lines.length > 22) { var extra = lines.length - 22; lines = lines.slice(0, 22); lines.push('… +' + extra + ' more'); }
          return lines;
        }
        var _leaveTooltipLines = _buildLines(leaveList, 'No one on approved leave today', true);
        var _absentTooltipLines = (function(){
          if (absentList.length === 0) return ['\u2713 Everyone checked in today'];
          var byDept = {};
          absentList.forEach(function(e){ (byDept[e.dept||'Other'] = byDept[e.dept||'Other'] || []).push(e.name + ' (' + e.code + ')'); });
          var lines = [];
          Object.keys(byDept).sort().forEach(function(d){
            lines.push(d + ':');
            byDept[d].forEach(function(n){ lines.push('  • ' + n); });
          });
          if (lines.length > 22) { var extra = lines.length - 22; lines = lines.slice(0, 22); lines.push('\u2026 +' + extra + ' more'); }
          return lines;
        })();
        new Chart(a3, {
          type:'doughnut',
          data:{
            labels:[
              'Present ('+(at.present||0)+')',
              'Leave ('+(at.leave||0)+')',
              'Absent ('+(at.absent||0)+')'
            ],
            datasets:[{
              data:[at.present||0, at.leave||0, at.absent||0],
              backgroundColor:['#22c55e','#f59e0b','#fee2e2'],
              borderColor:['#22c55e','#f59e0b','#ef4444'],
              borderWidth:2,
              hoverOffset:6
            }]
          },
          options:{
            responsive:true, cutout:'65%',
            plugins:{
              legend:{position:'bottom',labels:{font:{size:11},padding:12}},
              tooltip:{
                backgroundColor:'rgba(17,24,39,0.95)', titleColor:'#fff', bodyColor:'#e5e7eb',
                padding:10, cornerRadius:6, bodyFont:{size:11}, titleFont:{size:12,weight:'bold'},
                displayColors:false, boxPadding:4,
                callbacks:{
                  title: function(items){
                    if (!items || !items[0]) return '';
                    var i = items[0].dataIndex;
                    if (i === 0) return 'Present today (' + (at.present||0) + ')';
                    if (i === 1) return 'On leave today (' + (at.leave||0) + ')';
                    return 'Absent today (' + absentList.length + ')';
                  },
                  label: function(ctx){
                    if (ctx.dataIndex === 0) return 'Present: ' + (at.present||0);
                    if (ctx.dataIndex === 1) return _leaveTooltipLines;
                    return _absentTooltipLines;
                  }
                }
              }
            }
          }
        });
      }

      // Dept distribution
      var dd = data.deptDistribution || [];
      var a4 = document.getElementById('chartDeptDist');
      if (a4 && dd.length > 0) {
        new Chart(a4, { type:'bar', data:{ labels:dd.map(function(d){return d.dept||'N/A';}), datasets:[{label:'Count',data:dd.map(function(d){return d.count;}),backgroundColor:palette,borderRadius:6,borderSkipped:false}] },
          options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{stepSize:1},grid:{color:'rgba(0,0,0,.04)'}},y:{grid:{display:false}}}} });
      }

      // Monthly attendance trend
      var ma = data.monthlyAttendance || [];
      var a5 = document.getElementById('chartMonthlyAttendance');
      if (a5 && ma.length > 0) {
        var ctx5 = a5.getContext('2d');
        gradientBlue = makeGradient(ctx5, 'rgba(59,130,246,.3)', 'rgba(59,130,246,.02)');
        new Chart(a5, { type:'line', data:{ labels:ma.map(function(d){return d.month;}), datasets:[{label:'Unique Check-ins',data:ma.map(function(d){return d.unique_checkins;}),borderColor:'#3b82f6',borderWidth:2.5,tension:.4,fill:true,backgroundColor:gradientBlue,pointBackgroundColor:'#3b82f6',pointRadius:4,pointHoverRadius:6}] },
          options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false}}}} });
      }

      // Leave stats
      var ls = data.leaveStats || [];
      var a6 = document.getElementById('chartLeaveStats');
      if (a6) {
        var lsL = ls.length > 0 ? ls.map(function(l){return (l.status||'').replace(/_/g,' ');}) : ['None'];
        var lsD = ls.length > 0 ? ls.map(function(l){return l.count;}) : [0];
        var lsC = ls.length > 0 ? ls.map(function(l){var s=l.status;return s==='approved'?'#22c55e':s==='rejected'?'#ef4444':s==='hr_accepted'?'#3b82f6':'#f59e0b';}) : ['#e5e7eb'];
        new Chart(a6, { type:'doughnut', data:{ labels:lsL, datasets:[{data:lsD,backgroundColor:lsC,borderWidth:0,hoverOffset:6}] },
          options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:12}}}} });
      }

      // MD: Stock by category
      var sc = data.stockByCategory || [];
      var a8 = document.getElementById('chartStockCategory');
      if (a8 && sc.length > 0) {
        new Chart(a8, { type:'doughnut', data:{ labels:sc.map(function(d){return d.category;}), datasets:[{data:sc.map(function(d){return d.value;}),backgroundColor:palette,borderWidth:0,hoverOffset:6}] },
          options:{responsive:true,cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:10}},tooltip:{callbacks:{label:function(ctx){return ctx.label+': Rs.'+Number(ctx.raw).toLocaleString('en-IN');}}}}} });
      }

      // MD: Stock consumption
      var scon = data.stockConsumption || [];
      var a9 = document.getElementById('chartStockConsumption');
      if (a9 && scon.length > 0) {
        var ctx9 = a9.getContext('2d');
        gradientRed = makeGradient(ctx9, 'rgba(239,68,68,.3)', 'rgba(239,68,68,.02)');
        new Chart(a9, { type:'line', data:{ labels:scon.map(function(d){return d.month;}), datasets:[{label:'Material Issued',data:scon.map(function(d){return d.total_issued;}),borderColor:'#ef4444',borderWidth:2.5,tension:.4,fill:true,backgroundColor:gradientRed,pointBackgroundColor:'#ef4444',pointRadius:4,pointHoverRadius:6}] },
          options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false}}}} });
      }
    });
  }).catch(function() { c.innerHTML = ''; });
}

// =====================================================
// GEOFENCE SITE MANAGEMENT (Admin Panel)
// =====================================================
function renderGeofenceSites() {
  var c = document.getElementById('geofenceSiteList');
  if (!c) return;
  if (!siteLocations || siteLocations.length === 0) {
    c.innerHTML = '<div style="padding:12px;text-align:center;color:var(--gray-400);font-size:.8rem">No sites configured</div>';
    return;
  }
  var html = '';
  siteLocations.forEach(function(site, idx) {
    html += '<div class="dept-manage-item" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">';
    html += '<div class="dept-color" style="background:var(--primary);width:6px;height:40px;border-radius:3px"></div>';
    html += '<div style="flex:1"><h4 style="font-size:.82rem;font-weight:600;margin:0">' + escapeHTML(site.name) + '</h4>';
    html += '<p style="font-size:.68rem;color:var(--gray-500);margin:2px 0 0">Lat: ' + site.lat + ', Lng: ' + site.lng + ' · Radius: ' + site.radius + 'm</p></div>';
    html += '<button style="background:none;border:none;color:var(--primary);cursor:pointer;padding:6px;font-size:.72rem;font-weight:600" onclick="editGeofenceSite(' + idx + ')">Edit</button>';
    html += '<button style="background:none;border:none;color:var(--danger);cursor:pointer;padding:6px;font-size:.72rem;font-weight:600" onclick="deleteGeofenceSite(' + idx + ')">Delete</button>';
    html += '</div>';
  });
  c.innerHTML = html;
}

async function addGeofenceSiteFromForm() {
  var name = (document.getElementById('geoSiteName').value || '').trim();
  var lat = parseFloat(document.getElementById('geoSiteLat').value);
  var lng = parseFloat(document.getElementById('geoSiteLng').value);
  var radius = parseInt(document.getElementById('geoSiteRadius').value, 10);
  if (!name) { showToast('Please enter a site name'); return; }
  if (isNaN(lat) || lat < -90 || lat > 90) { showToast('Invalid latitude (-90 to 90)'); return; }
  if (isNaN(lng) || lng < -180 || lng > 180) { showToast('Invalid longitude (-180 to 180)'); return; }
  if (isNaN(radius) || radius < 50 || radius > 5000) { showToast('Radius must be 50–5000 meters'); return; }
  try {
    var result = await apiCall('POST', '/geofence/sites', { name: name, lat: lat, lng: lng, radius: radius });
    siteLocations.push(mapGeofenceSite(result));
  } catch (e) {
    siteLocations.push({ name: name, lat: lat, lng: lng, radius: radius });
  }
  showToast('Site "' + name + '" added');
  document.getElementById('geoSiteName').value = '';
  document.getElementById('geoSiteLat').value = '';
  document.getElementById('geoSiteLng').value = '';
  document.getElementById('geoSiteRadius').value = '200';
  renderGeofenceSites();
}

async function editGeofenceSite(idx) {
  var site = siteLocations[idx];
  if (!site) return;
  var newName = prompt('Site name:', site.name);
  if (newName === null) return;
  newName = newName.trim();
  if (!newName) { showToast('Name cannot be empty'); return; }
  var newLat = prompt('Latitude:', site.lat);
  if (newLat === null) return;
  newLat = parseFloat(newLat);
  if (isNaN(newLat) || newLat < -90 || newLat > 90) { showToast('Invalid latitude'); return; }
  var newLng = prompt('Longitude:', site.lng);
  if (newLng === null) return;
  newLng = parseFloat(newLng);
  if (isNaN(newLng) || newLng < -180 || newLng > 180) { showToast('Invalid longitude'); return; }
  var newRadius = prompt('Radius (meters):', site.radius);
  if (newRadius === null) return;
  newRadius = parseInt(newRadius, 10);
  if (isNaN(newRadius) || newRadius < 50 || newRadius > 5000) { showToast('Radius must be 50–5000 meters'); return; }
  try {
    if (site.id) {
      await apiCall('PUT', '/geofence/sites/' + site.id, { name: newName, lat: newLat, lng: newLng, radius: newRadius });
    }
  } catch (e) { /* update locally anyway */ }
  siteLocations[idx] = Object.assign({}, site, { name: newName, lat: newLat, lng: newLng, radius: newRadius });
  showToast('Site updated');
  renderGeofenceSites();
}

async function deleteGeofenceSite(idx) {
  if (isTemporaryMD()) { showToast('Temporary MD does not have delete permissions'); return; }
  var site = siteLocations[idx];
  if (!site) return;
  if (!confirm('Delete site "' + site.name + '"?')) return;
  try {
    if (site.id) {
      await apiCall('DELETE', '/geofence/sites/' + site.id);
    }
  } catch (e) { /* delete locally anyway */ }
  siteLocations.splice(idx, 1);
  showToast('Site deleted');
  renderGeofenceSites();
}

function useCurrentLocationForGeo() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  showToast('Getting location...');
  navigator.geolocation.getCurrentPosition(function(pos) {
    document.getElementById('geoSiteLat').value = pos.coords.latitude.toFixed(6);
    document.getElementById('geoSiteLng').value = pos.coords.longitude.toFixed(6);
    showToast('GPS coordinates filled');
  }, function(err) {
    showToast('Location error: ' + err.message);
  }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 15000 });
}

// =====================================================
// F5: FORM 16 / TAX FUNCTIONS
// =====================================================
let currentTaxTab = 'declaration';
// switchTaxTab is defined in the CHANGE 8 block below
function calculateTaxLiability(empCode) {
  const emp = EMPLOYEES.find(e => e.code === empCode);
  if (!emp) return null;
  const annualGross = emp.salary * 12;
  const dec = taxDeclarations[empCode] || {};
  const sec80C = Math.min(dec.sec80C || 0, TAX_LIMITS.sec80C);
  const sec80D = Math.min(dec.sec80D || 0, TAX_LIMITS.sec80D);
  const hra = dec.hra || 0;
  const stdDeduction = TAX_LIMITS.stdDeduction;
  const totalDeductions = sec80C + sec80D + hra + stdDeduction;
  const taxableIncome = Math.max(0, annualGross - totalDeductions);
  let tax = 0;
  for (const slab of TAX_SLABS_OLD) {
    if (taxableIncome > slab.min) {
      const taxable = Math.min(taxableIncome, slab.max === Infinity ? taxableIncome : slab.max) - slab.min;
      tax += taxable * slab.rate / 100;
    }
  }
  const cess = tax * 0.04;
  return {
    annualGross, stdDeduction, sec80C, sec80D, hra, totalDeductions,
    taxableIncome, tax: Math.round(tax), cess: Math.round(cess),
    totalTax: Math.round(tax + cess), monthlyTds: Math.round((tax + cess) / 12)
  };
}
async function submitTaxDeclaration() {
  if (!currentUser) return;
  const sec80C = parseFloat(document.getElementById('tax80C').value) || 0;
  const sec80D = parseFloat(document.getElementById('tax80D').value) || 0;
  const hra = parseFloat(document.getElementById('taxHRA').value) || 0;
  const homeLoan = parseFloat(document.getElementById('taxHomeLoan').value) || 0;
  try {
    const taxCalc = calculateTaxLiability(currentUser.code);
    await apiCall('POST', '/tax', { fy: '2025-26', section_80c: sec80C, section_80d: sec80D, hra_exemption: hra, home_loan_interest: homeLoan, annual_income: taxCalc ? taxCalc.annualGross : 0, total_deductions: taxCalc ? taxCalc.totalDeductions : 0, taxable_income: taxCalc ? taxCalc.taxableIncome : 0, tax_liability: taxCalc ? taxCalc.totalTax : 0, monthly_tds: taxCalc ? taxCalc.monthlyTds : 0 });
    taxDeclarations[currentUser.code] = { sec80C, sec80D, hra, homeLoan, submittedOn: new Date().toISOString().split('T')[0] };
    showToast('Tax declaration submitted');
    switchTaxTab('summary');
  } catch (e) { showToast(e.message || 'Error submitting tax declaration'); }
}
async function generateForm16PDF(empCode) {
  const emp = EMPLOYEES.find(e => e.code === (empCode || currentUser.code));
  if (!emp) return;
  const tax = calculateTaxLiability(emp.code);
  if (!tax) return;
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','mm','a4');
  let y = 20;
  doc.setFontSize(14); doc.setFont('Helvetica','bold');
  doc.text('FORM No. 16', 105, y, {align:'center'}); y += 8;
  doc.setFontSize(9); doc.setFont('Helvetica','normal');
  doc.text('Certificate under Section 203 of the Income-tax Act, 1961', 105, y, {align:'center'}); y += 6;
  doc.text('for Tax Deducted at Source on Salary', 105, y, {align:'center'}); y += 10;
  doc.setFontSize(10); doc.setFont('Helvetica','bold');
  doc.text(COMPANY_NAME, 20, y); y += 5;
  doc.setFont('Helvetica','normal'); doc.setFontSize(8);
  doc.text(COMPANY_ADDRESS, 20, y); y += 5;
  doc.text('GSTIN: ' + COMPANY_GSTIN, 20, y); y += 8;
  doc.line(20, y, 190, y); y += 6;
  doc.setFontSize(9);
  doc.text('Employee Name: ' + emp.name, 20, y); doc.text('Employee Code: ' + emp.code, 120, y); y += 5;
  doc.text('Designation: ' + emp.designation, 20, y); doc.text('PAN: ' + (emp.pan || 'Not on file'), 120, y); y += 5;
  doc.text('Assessment Year: 2026-27', 20, y); doc.text('Period: Apr 2025 - Mar 2026', 120, y); y += 8;
  doc.line(20, y, 190, y); y += 6;
  const rows = [
    ['Gross Salary', 'Rs.' + tax.annualGross.toLocaleString('en-IN')],
    ['Standard Deduction u/s 16(ia)', 'Rs.' + tax.stdDeduction.toLocaleString('en-IN')],
    ['Deduction u/s 80C', 'Rs.' + tax.sec80C.toLocaleString('en-IN')],
    ['Deduction u/s 80D', 'Rs.' + tax.sec80D.toLocaleString('en-IN')],
    ['HRA Exemption', 'Rs.' + tax.hra.toLocaleString('en-IN')],
    ['Total Deductions', 'Rs.' + tax.totalDeductions.toLocaleString('en-IN')],
    ['Taxable Income', 'Rs.' + tax.taxableIncome.toLocaleString('en-IN')],
    ['Income Tax', 'Rs.' + tax.tax.toLocaleString('en-IN')],
    ['Health & Education Cess (4%)', 'Rs.' + tax.cess.toLocaleString('en-IN')],
    ['Total Tax Liability', 'Rs.' + tax.totalTax.toLocaleString('en-IN')]
  ];
  rows.forEach(r => {
    doc.text(r[0], 25, y); doc.text(r[1], 170, y, {align:'right'});
    y += 5;
    if (r[0] === 'Total Deductions' || r[0] === 'Taxable Income') { doc.line(20, y-2, 190, y-2); y += 2; }
  });
  y += 10;
  doc.setFontSize(8);
  doc.text('This is a computer-generated Form 16 for illustration purposes.', 105, y, {align:'center'});
  savePdfSafe(doc, `Form16_${emp.code}_AY2026-27.pdf`);
  showToast('Form 16 PDF downloaded');
}
function renderTaxOverlay() {
  renderTaxOverlayExtended();
}

// =====================================================
// F6: COMPLIANCE FUNCTIONS
// =====================================================
let currentComplianceTab = 'filing';
function switchComplianceTab(tab) {
  currentComplianceTab = tab;
  document.querySelectorAll('#complianceTabs .compliance-tab').forEach(t => t.classList.remove('active'));
  const idx = tab==='filing'?1:tab==='calendar'?2:tab==='wages'?3:4;
  document.querySelector(`#complianceTabs .compliance-tab:nth-child(${idx})`).classList.add('active');
  renderComplianceOverlay();
}
function generateComplianceDeadlines() {
  if (complianceFilings.length > 0) return;
  const now = new Date();
  COMPLIANCE_TYPES.forEach(ct => {
    for (let m = 0; m < 12; m++) {
      const deadlineDate = new Date(2026, m, ct.due);
      complianceFilings.push({
        id: complianceNextId++, type: ct.code, name: ct.name, authority: ct.authority,
        deadline: deadlineDate.toISOString().split('T')[0],
        month: deadlineDate.toLocaleString('en-IN',{month:'short',year:'numeric'}),
        status: deadlineDate < now ? 'Overdue' : 'Pending', filedOn: null
      });
    }
  });
}
async function markFiled(id) {
  try {
    var f = complianceFilings.find(function(c) { return c.id === id; });
    if (!f) return;
    await apiCall('PUT', '/compliance/filings/' + id + '/mark-filed', {});
    f.status = 'Filed'; f.filedOn = new Date().toISOString().split('T')[0];
    renderComplianceOverlay(); showToast('Marked as filed');
  } catch (e) { showToast(e.message || 'Error marking as filed'); }
}
function checkMinWageCompliance() {
  const violations = [];
  EMPLOYEES.forEach(emp => {
    const skill = DESIGNATION_SKILL_MAP[emp.designation] || 'Unskilled';
    const minWage = MIN_WAGES_TN[skill] || MIN_WAGES_TN['Unskilled'];
    if (emp.salary < minWage) {
      violations.push({ emp, skill, minWage, deficit: minWage - emp.salary });
    }
  });
  return violations;
}
async function addContractWorker() {
  const name = prompt('Contract worker name:');
  if (!name) return;
  const contractor = prompt('Contractor name:');
  try {
    var workerData = { name, contractor: contractor || 'Self', startDate: new Date().toISOString().split('T')[0], status: 'Active', dept: 'Execution' };
    var res = await apiCall('POST', '/compliance/workers', workerData);
    workerData.id = res && res.id ? res.id : contractWorkerNextId++;
    contractWorkers.push(workerData);
    renderComplianceOverlay();
    showToast('Contract worker added');
  } catch (e) { showToast(e.message || 'Error adding contract worker'); }
}
function renderComplianceOverlay() {
  const c = document.getElementById('complianceContent');
  if (!c) return;
  generateComplianceDeadlines();
  let html = '';
  if (currentComplianceTab === 'filing') {
    const now = new Date();
    const upcoming = complianceFilings.filter(f => f.status !== 'Filed').sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 20);
    html = '<div class="nf-section"><div class="nf-section-title">Upcoming Filings</div>';
    upcoming.forEach(f => {
      const dl = new Date(f.deadline);
      const isOverdue = dl < now && f.status !== 'Filed';
      const dotCls = f.status === 'Filed' ? 'filing-filed' : isOverdue ? 'filing-overdue' : 'filing-upcoming';
      html += `<div class="filing-item"><div class="filing-status-dot ${dotCls}"></div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${f.name}</div><div style="font-size:.72rem;color:var(--gray-500)">${f.month} &middot; Due: ${f.deadline} &middot; ${f.authority}</div></div>`;
      if (f.status !== 'Filed') {
        html += `<button class="nf-btn nf-btn-success nf-btn-sm" onclick="markFiled(${f.id})">Mark Filed</button>`;
      } else {
        html += `<span class="badge-status badge-approved">Filed ${f.filedOn}</span>`;
      }
      html += '</div>';
    });
    html += '</div>';
  } else if (currentComplianceTab === 'calendar') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    html = '<div class="card"><div class="nf-section-title">2026 Compliance Calendar</div><div style="overflow-x:auto"><table style="width:100%;font-size:.7rem;border-collapse:collapse">';
    html += '<tr style="background:var(--gray-100)"><th style="padding:6px;text-align:left">Type</th>';
    months.forEach(m => html += `<th style="padding:4px;text-align:center">${m}</th>`);
    html += '</tr>';
    COMPLIANCE_TYPES.forEach(ct => {
      html += `<tr><td style="padding:4px;font-weight:600">${ct.code}</td>`;
      months.forEach((m,i) => {
        const filing = complianceFilings.find(f => f.type === ct.code && new Date(f.deadline).getMonth() === i);
        const color = !filing ? '#eee' : filing.status === 'Filed' ? '#22C55E' : filing.status === 'Overdue' ? '#EF4444' : '#F59E0B';
        html += `<td style="padding:4px;text-align:center"><div style="width:14px;height:14px;border-radius:50%;background:${color};margin:0 auto"></div></td>`;
      });
      html += '</tr>';
    });
    html += '</table></div></div>';
  } else if (currentComplianceTab === 'wages') {
    const violations = checkMinWageCompliance();
    html = '<div class="card"><div class="nf-section-title">Tamil Nadu Minimum Wages Check</div>';
    Object.entries(MIN_WAGES_TN).forEach(([skill, wage]) => {
      html += `<div class="min-wage-row"><span>${skill}</span><span style="font-weight:600">Rs.${wage.toLocaleString('en-IN')}</span></div>`;
    });
    html += '</div>';
    html += `<div class="card" style="margin-top:12px"><div class="nf-section-title">Violations (${violations.length})</div>`;
    if (violations.length === 0) {
      html += '<div style="padding:12px;color:var(--success);font-size:.82rem">✓ All employees meet minimum wage requirements</div>';
    } else {
      violations.forEach(v => {
        html += `<div class="min-wage-row"><div><div style="font-weight:600">${v.emp.name}</div><div style="font-size:.7rem;color:var(--gray-500)">${v.emp.designation} (${v.skill})</div></div><div style="text-align:right"><div style="color:var(--danger);font-weight:600">Rs.${v.emp.salary.toLocaleString('en-IN')}</div><div style="font-size:.68rem;color:var(--danger)">Deficit: Rs.${v.deficit.toLocaleString('en-IN')}</div></div></div>`;
      });
    }
    html += '</div>';
  } else {
    html = '<div class="card"><div class="nf-section-title">CLRA Register — Contract Workers</div>';
    html += `<button class="nf-btn nf-btn-primary nf-btn-sm" style="margin-bottom:12px" onclick="addContractWorker()">+ Add Worker</button>`;
    if (contractWorkers.length === 0) {
      html += '<div class="nf-empty">No contract workers registered</div>';
    } else {
      contractWorkers.forEach(w => {
        html += `<div class="filing-item"><div class="filing-status-dot ${w.status==='Active'?'filing-filed':'filing-overdue'}"></div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${escapeHTML(w.name)}</div><div style="font-size:.72rem;color:var(--gray-500)">Contractor: ${escapeHTML(w.contractor)} &middot; Since: ${w.startDate}</div></div><span class="badge-status ${w.status==='Active'?'badge-approved':'badge-rejected'}">${w.status}</span></div>`;
      });
    }
    html += '</div>';
  }
  c.innerHTML = html;
}

// =====================================================
// F7: ASSET MANAGEMENT FUNCTIONS
// =====================================================
function renderAssetsOverlay() {
  const c = document.getElementById('assetsContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  // Summary
  const total = assetInventory.length;
  const assigned = assetInventory.filter(a => a.assignedTo).length;
  const available = total - assigned;
  let html = '<div class="asset-summary-grid"><div class="asset-summary-card"><div class="num">' + total + '</div><div class="lbl">Total</div></div><div class="asset-summary-card"><div class="num" style="color:var(--success)">' + assigned + '</div><div class="lbl">Assigned</div></div><div class="asset-summary-card"><div class="num" style="color:var(--warning)">' + available + '</div><div class="lbl">Available</div></div></div>';
  if (isMdHr) {
    html += '<button class="nf-btn nf-btn-primary" style="margin-bottom:12px" onclick="openAssetForm()">+ Add Asset</button>';
  }
  const typeIcons = {'Laptop':'💻','Desktop':'🖥️','Mobile Phone':'📱','Tablet':'📱','Safety Helmet':'⛑️','Safety Shoes':'👟','Uniform':'👔','Vehicle':'🚗','Tools':'🔧','Furniture':'🪑','Printer':'🖨️','Other':'📦'};
  if (assetInventory.length === 0) {
    html += '<div class="nf-empty">No assets in inventory</div>';
  } else {
    assetInventory.forEach(asset => {
      const condCls = asset.condition === 'Good' || asset.condition === 'New' ? 'asset-good' : asset.condition === 'Fair' ? 'asset-fair' : 'asset-poor';
      html += `<div class="asset-card"><div class="asset-header"><div style="display:flex;align-items:center;gap:8px"><div class="asset-type-icon" style="background:var(--gray-100)">${typeIcons[asset.type]||'📦'}</div><div><div style="font-weight:600;font-size:.85rem">${escapeHTML(asset.name)}</div><div style="font-size:.72rem;color:var(--gray-500)">${escapeHTML(asset.type)} &middot; #${asset.id}</div></div></div><span class="asset-condition ${condCls}">${asset.condition}</span></div>`;
      if (asset.assignedTo) {
        const emp = EMPLOYEES.find(e => e.code === asset.assignedTo);
        html += `<div style="font-size:.78rem;color:var(--gray-600);margin-top:4px">Assigned to: <strong>${emp?escapeHTML(emp.name):escapeHTML(asset.assignedTo)}</strong></div>`;
        if (isMdHr) html += `<button class="nf-btn nf-btn-outline nf-btn-sm" style="margin-top:6px" onclick="returnAsset(${asset.id})">Return</button>`;
      } else if (isMdHr) {
        html += `<div style="margin-top:6px"><select class="nf-select" style="display:inline;width:auto;min-width:120px;font-size:.72rem" id="assetAssign${asset.id}">`;
        html += '<option value="">Assign to...</option>';
        EMPLOYEES.forEach(e => html += `<option value="${e.code}">${e.name} (${e.code})</option>`);
        html += `</select> <button class="nf-btn nf-btn-success nf-btn-sm" onclick="assignAsset(${asset.id},document.getElementById('assetAssign${asset.id}').value)">Assign</button></div>`;
      }
      html += '</div>';
    });
  }
  c.innerHTML = html;
}
function openAssetForm() {
  const c = document.getElementById('assetsContent');
  let html = '<div class="card" style="margin-bottom:12px"><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">Add New Asset</h3>';
  html += '<div class="ss-form-group"><label>Asset Name *</label><input type="text" id="assetName" placeholder="e.g. Dell Latitude 5520"></div>';
  html += '<div class="ss-form-group"><label>Type *</label><select class="nf-select" id="assetType"><option value="">Select</option>';
  ASSET_TYPES.forEach(t => html += `<option>${t}</option>`);
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Serial Number</label><input type="text" id="assetSerial" placeholder="S/N"></div>';
  html += '<div class="ss-form-group"><label>Purchase Date</label><input type="date" id="assetDate" value="' + new Date().toISOString().split('T')[0] + '"></div>';
  html += '<div class="ss-form-group"><label>Purchase Cost (Rs.)</label><input type="number" id="assetCost" placeholder="e.g. 45000"></div>';
  html += '<div class="ss-form-group"><label>Condition</label><select class="nf-select" id="assetCondition"><option>New</option><option>Good</option><option>Fair</option></select></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="saveAsset()">Save Asset</button><button class="nf-btn nf-btn-outline" onclick="renderAssetsOverlay()">Cancel</button></div></div>';
  c.innerHTML = html;
}
async function saveAsset() {
  var name = document.getElementById('assetName').value.trim();
  var type = document.getElementById('assetType').value;
  if (!name || !type) { showToast('Name and type are required'); return; }
  try {
    var res = await apiCall('POST', '/assets', { asset_name: name, asset_type: type, serial_no: document.getElementById('assetSerial').value.trim(), purchase_date: document.getElementById('assetDate').value, purchase_cost: parseFloat(document.getElementById('assetCost').value) || 0, asset_condition: document.getElementById('assetCondition').value });
    assetInventory.push({
      id: (res && res.id) || assetNextId++, name: name, type: type,
      serial: document.getElementById('assetSerial').value.trim(),
      purchaseDate: document.getElementById('assetDate').value,
      cost: parseFloat(document.getElementById('assetCost').value) || 0,
      condition: document.getElementById('assetCondition').value,
      assignedTo: null, assignedDate: null
    });
    showToast('Asset added');
    renderAssetsOverlay();
  } catch (e) { showToast(e.message || 'Error adding asset'); }
}
async function assignAsset(id, empCode) {
  if (!empCode) { showToast('Select an employee'); return; }
  try {
    await apiCall('PUT', '/assets/' + id + '/assign', { emp_code: empCode });
    var asset = assetInventory.find(function(a) { return a.id === id; });
    if (asset) { asset.assignedTo = empCode; asset.assignedDate = new Date().toISOString().split('T')[0]; }
    renderAssetsOverlay(); showToast('Asset assigned');
  } catch (e) { showToast(e.message || 'Error assigning asset'); }
}
async function returnAsset(id) {
  try {
    await apiCall('PUT', '/assets/' + id + '/return', {});
    var asset = assetInventory.find(function(a) { return a.id === id; });
    if (asset) { asset.assignedTo = null; asset.assignedDate = null; }
    renderAssetsOverlay(); showToast('Asset returned');
  } catch (e) { showToast(e.message || 'Error returning asset'); }
}

// =====================================================
// F8: EXIT & F&F FUNCTIONS
// =====================================================
function renderExitOverlay() {
  const c = document.getElementById('exitContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  let html = '';
  if (isMdHr || exitRequests.some(e => e.empCode === currentUser.code)) {
    html += '<div style="display:flex;gap:8px;margin-bottom:12px"><button class="nf-btn nf-btn-primary" onclick="openExitApplyForm()">+ Submit Resignation</button></div>';
  } else {
    html += '<div style="margin-bottom:12px"><button class="nf-btn nf-btn-primary" onclick="openExitApplyForm()">Submit Resignation</button></div>';
  }
  const reqs = isMdHr ? exitRequests : exitRequests.filter(e => e.empCode === currentUser.code);
  if (reqs.length === 0) {
    html += '<div class="nf-empty">No exit requests</div>';
  } else {
    reqs.sort((a,b) => b.id - a.id).forEach(req => {
      const emp = EMPLOYEES.find(e => e.code === req.empCode);
      const badgeCls = req.status === 'Approved' ? 'badge-approved' : req.status === 'Completed' ? 'badge-paid' : req.status === 'Rejected' ? 'badge-rejected' : 'badge-pending';
      html += `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><div style="font-weight:600">${emp?escapeHTML(emp.name):escapeHTML(req.empCode)}</div><div style="font-size:.72rem;color:var(--gray-500)">${escapeHTML(req.reason)} &middot; Applied: ${req.appliedOn}</div></div><span class="badge-status ${badgeCls}">${req.status}</span></div>`;
      if (req.status === 'Pending' && isMdHr) {
        html += `<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-success nf-btn-sm" onclick="approveExit(${req.id})" aria-label="Approve exit request ${req.id}">Approve</button><button class="nf-btn nf-btn-danger nf-btn-sm" onclick="rejectExit(${req.id})" aria-label="Reject exit request ${req.id}">Reject</button></div>`;
      }
      if (req.status === 'Approved' && isMdHr) {
        html += '<div class="nf-section-title" style="margin-top:8px">Clearance Checklist</div>';
        const clearance = req.clearance || {};
        CLEARANCE_DEPTS.forEach(dept => {
          const done = clearance[dept];
          html += `<div class="clearance-item"><span style="font-size:.82rem">${escapeHTML(dept)}</span><div class="clearance-check ${done?'checked':''}" onclick="updateClearance(${req.id},'${escapeAttr(dept)}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div></div>`;
        });
        const allCleared = CLEARANCE_DEPTS.every(d => clearance[d]);
        if (allCleared) {
          html += `<div style="display:flex;gap:8px;margin-top:10px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="showFnFCalculation(${req.id})">View F&F</button><button class="nf-btn nf-btn-success nf-btn-sm" onclick="generateFnFPDF(${req.id})">Download F&F PDF</button><button class="nf-btn nf-btn-danger nf-btn-sm" onclick="completeExit(${req.id})">Complete Exit</button></div>`;
        }
      }
      html += '</div>';
    });
  }
  c.innerHTML = html;
}
function openExitApplyForm() {
  const c = document.getElementById('exitContent');
  let html = '<div class="card" style="margin-bottom:12px"><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">Submit Resignation</h3>';
  html += '<div class="ss-form-group"><label>Reason *</label><select class="nf-select" id="exitReason"><option value="">Select</option><option>Better Opportunity</option><option>Personal Reasons</option><option>Higher Studies</option><option>Relocation</option><option>Health</option><option>Other</option></select></div>';
  html += '<div class="ss-form-group"><label>Last Working Day (preferred)</label><input type="date" id="exitLwd"></div>';
  html += '<div class="ss-form-group"><label>Remarks</label><textarea id="exitRemarks" rows="2" placeholder="Additional comments..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="submitResignation()">Submit</button><button class="nf-btn nf-btn-outline" onclick="renderExitOverlay()">Cancel</button></div></div>';
  c.innerHTML = html;
}
async function submitResignation() {
  var reason = document.getElementById('exitReason').value;
  if (!reason) { showToast('Please select a reason'); return; }
  var noticePeriod = NOTICE_PERIODS[currentUser.role] || 30;
  var lwd = document.getElementById('exitLwd').value || (function() { var d = new Date(); d.setDate(d.getDate() + noticePeriod); return d.toISOString().split('T')[0]; })();
  var remarks = document.getElementById('exitRemarks').value.trim();
  try {
    var res = await apiCall('POST', '/exit', { reason: reason, remarks: remarks, preferred_lwd: lwd });
    exitRequests.push({
      id: (res && res.id) || exitNextId++, empCode: currentUser.code, reason: reason, lwd: lwd,
      remarks: remarks, noticePeriod: noticePeriod, appliedOn: new Date().toISOString().split('T')[0],
      status: 'Pending', clearance: {}
    });
    addNotification(currentUser.name + ' has submitted resignation', 'exit');
    showToast('Resignation submitted');
    renderExitOverlay();
  } catch (e) { showToast(e.message || 'Error submitting resignation'); }
}
async function approveExit(id) {
  try {
    await apiCall('PUT', '/exit/' + id + '/approve', {});
    var req = exitRequests.find(function(e) { return e.id === id; });
    if (req) { req.status = 'Approved'; req.approvedBy = currentUser.code; req.approvedOn = new Date().toISOString().split('T')[0]; }
    renderExitOverlay(); showToast('Exit approved');
  } catch (e) { showToast(e.message || 'Error approving exit'); }
}
async function rejectExit(id) {
  try {
    await apiCall('PUT', '/exit/' + id + '/reject', {});
    var req = exitRequests.find(function(e) { return e.id === id; });
    if (req) { req.status = 'Rejected'; }
    renderExitOverlay(); showToast('Exit rejected');
  } catch (e) { showToast(e.message || 'Error rejecting exit'); }
}
function updateClearance(exitId, dept) {
  var req = exitRequests.find(function(e) { return e.id === exitId; });
  if (req) {
    if (!req.clearance) req.clearance = {};
    req.clearance[dept] = !req.clearance[dept];
    renderExitOverlay();
  }
}
function calculateFnF(exitId) {
  const req = exitRequests.find(e => e.id === exitId);
  if (!req) return null;
  const emp = EMPLOYEES.find(e => e.code === req.empCode);
  if (!emp) return null;
  const doj = new Date(emp.doj);
  const today = new Date();
  const yearsOfService = (today - doj) / (365.25 * 24 * 60 * 60 * 1000);
  const dailySalary = emp.salary / 30;
  const pendingSalaryDays = 15;
  const pendingSalary = Math.round(dailySalary * pendingSalaryDays);
  const leaveBalance = leaveBalances[emp.code] || {};
  const unusedLeaves = (leaveBalance.casual || 0) + (leaveBalance.comp || 0);
  const leaveEncashment = Math.round(dailySalary * unusedLeaves);
  const gratuity = yearsOfService >= 5 ? Math.round(15 * dailySalary * yearsOfService / 26) : 0;
  const bonus = Math.round(emp.salary * 0.0833);
  const pendingAdvances = (typeof advanceRequests !== 'undefined' ? advanceRequests : []).filter(a => a.empCode === emp.code && a.status === 'Approved').reduce((sum, a) => sum + (a.balance || 0), 0);
  const assetValue = assetInventory.filter(a => a.assignedTo === emp.code).reduce((sum, a) => sum + (a.cost || 0) * 0.5, 0);
  const totalEarnings = pendingSalary + leaveEncashment + gratuity + bonus;
  const totalDeductions = pendingAdvances + assetValue;
  return {
    emp, yearsOfService: Math.round(yearsOfService * 10) / 10, pendingSalaryDays, pendingSalary,
    unusedLeaves, leaveEncashment, gratuity, bonus,
    pendingAdvances, assetValue: Math.round(assetValue),
    totalEarnings, totalDeductions, netPayable: totalEarnings - totalDeductions
  };
}
function showFnFCalculation(exitId) {
  const fnf = calculateFnF(exitId);
  if (!fnf) { showToast('Unable to calculate F&F'); return; }
  let msg = `Full & Final Settlement for ${fnf.emp.name}\n\n`;
  msg += `Years of Service: ${fnf.yearsOfService}\n`;
  msg += `Pending Salary (${fnf.pendingSalaryDays} days): Rs.${fnf.pendingSalary.toLocaleString('en-IN')}\n`;
  msg += `Leave Encashment (${fnf.unusedLeaves} days): Rs.${fnf.leaveEncashment.toLocaleString('en-IN')}\n`;
  msg += `Gratuity: Rs.${fnf.gratuity.toLocaleString('en-IN')}\n`;
  msg += `Bonus: Rs.${fnf.bonus.toLocaleString('en-IN')}\n`;
  msg += `\nDeductions:\n`;
  msg += `Pending Advances: Rs.${fnf.pendingAdvances.toLocaleString('en-IN')}\n`;
  msg += `Assets (depreciated): Rs.${fnf.assetValue.toLocaleString('en-IN')}\n`;
  msg += `\nNet Payable: Rs.${fnf.netPayable.toLocaleString('en-IN')}`;
  alert(msg);
}
async function generateFnFPDF(exitId) {
  const fnf = calculateFnF(exitId);
  if (!fnf) { showToast('Unable to generate F&F'); return; }
  await loadJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','mm','a4');
  let y = 20;
  if (COMPANY_LOGO_B64) { try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', 20, y-5, 32, 12); } catch(e){} }
  doc.setFontSize(12); doc.setFont('Helvetica','bold');
  doc.text(COMPANY_NAME, 55, y); y += 5;
  doc.setFontSize(8); doc.setFont('Helvetica','normal');
  doc.text(COMPANY_ADDRESS, 55, y); y += 10;
  doc.setFontSize(14); doc.setFont('Helvetica','bold');
  doc.text('Full & Final Settlement Statement', 105, y, {align:'center'}); y += 10;
  doc.line(20, y, 190, y); y += 6;
  doc.setFontSize(9); doc.setFont('Helvetica','normal');
  doc.text('Employee: ' + fnf.emp.name + ' (' + fnf.emp.code + ')', 20, y); y += 5;
  doc.text('Designation: ' + fnf.emp.designation, 20, y); doc.text('Department: ' + fnf.emp.dept, 120, y); y += 5;
  doc.text('Date of Joining: ' + fnf.emp.doj, 20, y); doc.text('Years of Service: ' + fnf.yearsOfService, 120, y); y += 8;
  doc.line(20, y, 190, y); y += 6;
  doc.setFont('Helvetica','bold'); doc.text('EARNINGS', 20, y); y += 6; doc.setFont('Helvetica','normal');
  const earnings = [
    ['Pending Salary (' + fnf.pendingSalaryDays + ' days)', fnf.pendingSalary],
    ['Leave Encashment (' + fnf.unusedLeaves + ' days)', fnf.leaveEncashment],
    ['Gratuity', fnf.gratuity],
    ['Bonus', fnf.bonus]
  ];
  earnings.forEach(r => { doc.text(r[0], 25, y); doc.text('Rs.' + r[1].toLocaleString('en-IN'), 170, y, {align:'right'}); y += 5; });
  doc.setFont('Helvetica','bold'); doc.text('Total Earnings', 25, y); doc.text('Rs.' + fnf.totalEarnings.toLocaleString('en-IN'), 170, y, {align:'right'}); y += 8;
  doc.setFont('Helvetica','bold'); doc.text('DEDUCTIONS', 20, y); y += 6; doc.setFont('Helvetica','normal');
  doc.text('Pending Advance Recovery', 25, y); doc.text('Rs.' + fnf.pendingAdvances.toLocaleString('en-IN'), 170, y, {align:'right'}); y += 5;
  doc.text('Assets (Depreciated Value)', 25, y); doc.text('Rs.' + fnf.assetValue.toLocaleString('en-IN'), 170, y, {align:'right'}); y += 5;
  doc.setFont('Helvetica','bold'); doc.text('Total Deductions', 25, y); doc.text('Rs.' + fnf.totalDeductions.toLocaleString('en-IN'), 170, y, {align:'right'}); y += 8;
  doc.line(20, y, 190, y); y += 6;
  doc.setFontSize(11);
  doc.text('NET PAYABLE: Rs.' + fnf.netPayable.toLocaleString('en-IN'), 105, y, {align:'center'}); y += 15;
  doc.setFontSize(8); doc.setFont('Helvetica','normal');
  doc.text('This is a computer-generated document.', 105, y, {align:'center'});
  savePdfSafe(doc, `FnF_${fnf.emp.code}_${new Date().toISOString().split('T')[0]}.pdf`);
  showToast('F&F PDF downloaded');
}
async function completeExit(id) {
  if (!confirm('Mark this exit as completed? This action cannot be undone.')) return;
  try {
    await apiCall('PUT', '/exit/' + id + '/complete', { fnf_amount: 0 });
    var req = exitRequests.find(function(e) { return e.id === id; });
    if (req) {
      req.status = 'Completed'; req.completedOn = new Date().toISOString().split('T')[0];
      var exitEmp = EMPLOYEES.find(function(e) { return e.code === req.empCode; });
      if (exitEmp) exitEmp.status = 'Inactive';
    }
    renderExitOverlay(); showToast('Exit completed — employee deactivated');
  } catch (e) { showToast(e.message || 'Error completing exit'); }
}

// =====================================================


// =====================================================
// F10: ANNOUNCEMENTS FUNCTIONS
// =====================================================
function getUnreadAnnouncementCount() {
  if (!currentUser) return 0;
  return announcements.filter(a => !announcementReadStatus[currentUser.code + '_' + a.id]).length;
}
function markAnnouncementRead(id) {
  if (!currentUser) return;
  announcementReadStatus[currentUser.code + '_' + id] = true;
  apiCall('POST', '/announcements/' + id + '/read', {}).catch(function(){});
}
async function createAnnouncement() {
  var title = document.getElementById('annTitle').value.trim();
  var body = document.getElementById('annBody').value.trim();
  var category = document.getElementById('annCategory').value;
  var priority = document.getElementById('annPriority').value;
  if (!title || !body) { showToast('Title and body are required'); return; }
  try {
    var res = await apiCall('POST', '/announcements', { title: title, content: body, category: category, priority: priority });
    announcements.push({
      id: (res && res.id) || announcementNextId++, title: title, body: body, category: category, priority: priority,
      author: currentUser.code, date: new Date().toISOString().split('T')[0]
    });
    addNotification('New announcement: ' + title, 'announcement');
    showToast('Announcement published');
    renderAnnouncementsOverlay();
  } catch (e) { showToast(e.message || 'Error creating announcement'); }
}
async function deleteAnnouncement(id) {
  if (isTemporaryMD()) { showToast('Temporary MD does not have delete permissions'); return; }
  if (!confirm('Delete this announcement?')) return;
  try {
    await apiCall('DELETE', '/announcements/' + id, {});
    var idx = announcements.findIndex(function(a) { return a.id === id; });
    if (idx >= 0) announcements.splice(idx, 1);
    renderAnnouncementsOverlay(); showToast('Announcement deleted');
  } catch (e) { showToast(e.message || 'Error deleting announcement'); }
}
function renderAnnouncementDashboard() {
  const el = document.getElementById('dashboardAnnouncements');
  if (!el || !currentUser) return;
  const unread = announcements.filter(a => !announcementReadStatus[currentUser.code + '_' + a.id]).slice(0, 3);
  if (unread.length === 0) { el.innerHTML = ''; return; }
  let html = '<div class="section-title">Announcements</div><div class="dashboard-announcements">';
  unread.forEach(a => {
    var idAttr = JSON.stringify(a.id);
    html += `<div class="dashboard-announce-item" onclick="markAnnouncementRead(${idAttr});showOverlay('hr-announcements')"><h4>${escapeHTML(a.title)}</h4><p>${a.date} &middot; ${escapeHTML(a.category)}</p></div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}
function renderAnnouncementsOverlay() {
  const c = document.getElementById('announcementsContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  let html = '';
  if (isMdHr) {
    html += '<button class="nf-btn nf-btn-primary" style="margin-bottom:12px" onclick="openAnnouncementForm()">+ New Announcement</button>';
  }
  if (announcements.length === 0) {
    html += '<div class="nf-empty">No announcements yet</div>';
  } else {
    // Holiday items (string ids) sort to the top; numeric ids sort descending
    var sorted = announcements.slice().sort(function(a, b) {
      var aHol = typeof a.id === 'string' && a.id.indexOf('holiday-') === 0;
      var bHol = typeof b.id === 'string' && b.id.indexOf('holiday-') === 0;
      if (aHol && !bHol) return -1;
      if (!aHol && bHol) return 1;
      return (b.id || 0) - (a.id || 0);
    });
    sorted.forEach(a => {
      const isHoliday = typeof a.id === 'string' && a.id.indexOf('holiday-') === 0;
      const isRead = announcementReadStatus[currentUser.code + '_' + a.id];
      const catCls = 'announce-' + (a.category||'general').toLowerCase().replace(/ /g,'-').replace('policy-update','policy');
      const author = EMPLOYEES.find(e => e.code === a.author);
      const idJson = JSON.stringify(a.id);
      html += `<div class="announcement-card ${isRead?'read':'unread'}" onclick="markAnnouncementRead(${idJson})"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px"><span class="announcement-cat ${catCls}">${escapeHTML(a.category)}</span><span style="font-size:.68rem;color:var(--gray-400)">${a.date}</span></div><div style="font-weight:600;font-size:.88rem;margin-bottom:4px">${escapeHTML(a.title)}</div><div style="font-size:.78rem;color:var(--gray-600);margin-bottom:6px">${escapeHTML(a.body)}</div><div style="font-size:.68rem;color:var(--gray-400)">By ${author?escapeHTML(author.name):'Admin'}`;
      if (isMdHr && !isHoliday) html += ` <button class="nf-btn nf-btn-danger nf-btn-sm" style="margin-left:8px;padding:2px 8px;font-size:.65rem" onclick="event.stopPropagation();deleteAnnouncement(${idJson})">Delete</button>`;
      html += '</div></div>';
    });
  }
  c.innerHTML = html;
}
function openAnnouncementForm() {
  const c = document.getElementById('announcementsContent');
  let html = '<div class="card" style="margin-bottom:12px"><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">New Announcement</h3>';
  html += '<div class="ss-form-group"><label>Title *</label><input type="text" id="annTitle" placeholder="Announcement title"></div>';
  html += '<div class="ss-form-group"><label>Category</label><select class="nf-select" id="annCategory">';
  ANNOUNCE_CATEGORIES.forEach(c => html += `<option>${c}</option>`);
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Priority</label><select class="nf-select" id="annPriority"><option value="normal">Normal</option><option value="high">High</option></select></div>';
  html += '<div class="ss-form-group"><label>Content *</label><textarea id="annBody" rows="3" placeholder="Announcement content..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="createAnnouncement()">Publish</button><button class="nf-btn nf-btn-outline" onclick="renderAnnouncementsOverlay()">Cancel</button></div></div>';
  c.innerHTML = html;
}

// =====================================================
// F11: CELEBRATIONS FUNCTIONS
// =====================================================
function getTodaysBirthdays() {
  const today = new Date();
  const m = today.getMonth() + 1, d = today.getDate();
  return EMPLOYEES.filter(e => {
    if (!e.dob) return false;
    const parts = e.dob.split('-');
    return parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === d;
  });
}
function getTodaysAnniversaries() {
  const today = new Date();
  const m = today.getMonth() + 1, d = today.getDate();
  return EMPLOYEES.filter(e => {
    if (!e.doj) return false;
    const parts = e.doj.split('-');
    return parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === d && parseInt(parts[0], 10) < today.getFullYear();
  });
}
function getMonthCelebrations(month) {
  const m = month || (new Date().getMonth() + 1);
  const bdays = EMPLOYEES.filter(e => e.dob && parseInt(e.dob.split('-')[1], 10) === m).map(e => ({...e, type:'birthday', day: parseInt(e.dob.split('-')[2], 10)}));
  const annivs = EMPLOYEES.filter(e => e.doj && parseInt(e.doj.split('-')[1], 10) === m && parseInt(e.doj.split('-')[0], 10) < new Date().getFullYear()).map(e => {
    const years = new Date().getFullYear() - parseInt(e.doj.split('-')[0], 10);
    return {...e, type:'anniversary', day: parseInt(e.doj.split('-')[2], 10), years};
  });
  return [...bdays, ...annivs].sort((a,b) => a.day - b.day);
}
function renderCelebrationCard() {
  const el = document.getElementById('dashboardCelebrations');
  if (!el) return;
  const bdays = getTodaysBirthdays();
  const annivs = getTodaysAnniversaries();
  if (bdays.length === 0 && annivs.length === 0) { el.innerHTML = ''; return; }
  let html = '<div class="celebration-card"><h3>Today\'s Celebrations</h3>';
  bdays.forEach(e => {
    html += `<div class="celebration-item"><div class="celebration-avatar celebration-bday">${e.name.charAt(0)}</div><div class="celebration-info"><h4>${e.name}</h4><p>Happy Birthday!</p></div></div>`;
  });
  annivs.forEach(e => {
    const years = new Date().getFullYear() - parseInt(e.doj.split('-')[0], 10);
    html += `<div class="celebration-item"><div class="celebration-avatar celebration-anniv">${e.name.charAt(0)}</div><div class="celebration-info"><h4>${e.name}</h4><p>${years} year${years>1?'s':''} work anniversary</p></div></div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}
function renderCelebrationsOverlay() {
  const c = document.getElementById('celebrationsContent');
  if (!c) return;
  const bdays = getTodaysBirthdays();
  const annivs = getTodaysAnniversaries();
  let html = '';
  if (bdays.length > 0 || annivs.length > 0) {
    html += '<div class="celebration-card"><h3>Today\'s Celebrations</h3>';
    bdays.forEach(e => {
      html += `<div class="celebration-item"><div class="celebration-avatar celebration-bday">${e.name.charAt(0)}</div><div class="celebration-info"><h4>${e.name}</h4><p>Happy Birthday! — ${e.dept}</p></div></div>`;
    });
    annivs.forEach(e => {
      const years = new Date().getFullYear() - parseInt(e.doj.split('-')[0], 10);
      html += `<div class="celebration-item"><div class="celebration-avatar celebration-anniv">${e.name.charAt(0)}</div><div class="celebration-info"><h4>${e.name}</h4><p>${years} year${years>1?'s':''} anniversary — ${e.dept}</p></div></div>`;
    });
    html += '</div>';
  }
  // This month
  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = new Date().getMonth() + 1;
  const celebrations = getMonthCelebrations(currentMonth);
  html += `<div class="card month-celebrations"><div class="nf-section-title">${monthNames[currentMonth]} Celebrations (${celebrations.length})</div>`;
  if (celebrations.length === 0) {
    html += '<div class="nf-empty">No celebrations this month</div>';
  } else {
    celebrations.forEach(c => {
      const icon = c.type === 'birthday' ? '🎂' : '🎉';
      const label = c.type === 'birthday' ? 'Birthday' : c.years + ' yr anniversary';
      html += `<div class="month-celebration-item"><span style="font-size:1.2rem">${icon}</span><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${c.name}</div><div style="font-size:.72rem;color:var(--gray-500)">${c.dept} &middot; ${label}</div></div><span style="font-size:.75rem;color:var(--gray-400)">${monthNames[currentMonth]} ${c.day}</span></div>`;
    });
  }
  html += '</div>';
  // Next month preview
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextCelebrations = getMonthCelebrations(nextMonth);
  html += `<div class="card month-celebrations" style="margin-top:12px"><div class="nf-section-title">${monthNames[nextMonth]} Upcoming (${nextCelebrations.length})</div>`;
  if (nextCelebrations.length === 0) {
    html += '<div class="nf-empty">No celebrations next month</div>';
  } else {
    nextCelebrations.slice(0,5).forEach(c => {
      const icon = c.type === 'birthday' ? '🎂' : '🎉';
      const label = c.type === 'birthday' ? 'Birthday' : c.years + ' yr anniversary';
      html += `<div class="month-celebration-item"><span style="font-size:1.2rem">${icon}</span><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${c.name}</div><div style="font-size:.72rem;color:var(--gray-500)">${c.dept} &middot; ${label}</div></div><span style="font-size:.75rem;color:var(--gray-400)">${monthNames[nextMonth]} ${c.day}</span></div>`;
    });
    if (nextCelebrations.length > 5) html += `<div style="font-size:.72rem;color:var(--gray-400);text-align:center;padding:6px">+${nextCelebrations.length-5} more</div>`;
  }
  html += '</div>';
  c.innerHTML = html;
}

// =====================================================
// PROJECT MANAGEMENT FUNCTIONS
// =====================================================
let currentProjectTab = 'overview';

var dailyLogViewMode = 'card';

function renderProgressScreen() {
  const container = document.getElementById('projectsList');
  const grid = document.getElementById('staffDeploymentGrid');
  if (!container) return;
  const isMDorHR = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  const isMD = currentUser && currentUser.role === 'MD';

  const statusBadge = {'Not Started':'badge-pending','In Progress':'badge-open','On Track':'badge-approved','Delayed':'badge-pending','Completed':'badge-approved'};
  const barColors = {'Not Started':'var(--gray-300)','In Progress':'var(--primary)','On Track':'var(--success)','Delayed':'var(--warning)','Completed':'var(--success)'};
  var avatarColors = ['#E85D04','#3B82F6','#10B981','#8B5CF6','#EC4899','#F59E0B'];

  // KPI counts
  var totalCount = projects.length;
  var activeCount = projects.filter(function(p){return p.status==='In Progress'||p.status==='On Track';}).length;
  var delayedCount = projects.filter(function(p){return p.status==='Delayed';}).length;
  var completedCount = projects.filter(function(p){return p.status==='Completed';}).length;

  var html = '';

  // KPI Strip
  html += '<div class="proj-kpi-strip">';
  html += '<div class="proj-kpi-card kpi-total"><div class="proj-kpi-value">' + totalCount + '</div><div class="proj-kpi-label">Total</div></div>';
  html += '<div class="proj-kpi-card kpi-active"><div class="proj-kpi-value">' + activeCount + '</div><div class="proj-kpi-label">Active</div></div>';
  html += '<div class="proj-kpi-card kpi-delayed"><div class="proj-kpi-value">' + delayedCount + '</div><div class="proj-kpi-label">Delayed</div></div>';
  html += '<div class="proj-kpi-card kpi-completed"><div class="proj-kpi-value">' + completedCount + '</div><div class="proj-kpi-label">Completed</div></div>';
  html += '</div>';

  // Filter bar
  html += '<div class="proj-filter-bar">';
  html += '<input type="text" id="projSearchInput" placeholder="Search projects..." oninput="filterProjectsTable()">';
  html += '<select id="projStatusFilter" onchange="filterProjectsTable()"><option value="">All Status</option>';
  PROJECT_STATUSES.forEach(function(s) { html += '<option value="' + s + '">' + s + '</option>'; });
  html += '</select></div>';

  function buildProjectRow(p, idx) {
    var pct = getProjectProgress(p);
    var barColor = barColors[p.status] || 'var(--primary)';
    var badge = statusBadge[p.status] || 'badge-open';
    var target = p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '-';
    var teamHtml = '<div class="proj-team-mini">';
    var teamSlice = p.team.slice(0, 3);
    teamSlice.forEach(function(code, i) {
      var emp = EMPLOYEES.find(function(e) { return e.code === code; });
      var init = emp ? emp.name.charAt(0) : '?';
      teamHtml += '<div class="tm-avatar" style="background:' + avatarColors[i % avatarColors.length] + '">' + escapeHTML(init) + '</div>';
    });
    if (p.team.length > 3) {
      teamHtml += '<div class="tm-avatar" style="background:var(--gray-400);font-size:.5rem">+' + (p.team.length - 3) + '</div>';
    }
    teamHtml += '</div>';

    var row = '<tr class="proj-data-row" data-name="' + escapeHTML(p.name.toLowerCase()) + '" data-status="' + escapeHTML(p.status) + '" onclick="showProjectDetail(' + p.id + ')">';
    row += '<td style="color:var(--gray-400);font-size:.68rem">' + (idx + 1) + '</td>';
    row += '<td class="proj-name-cell">' + escapeHTML(p.name) + '</td>';
    row += '<td class="proj-client-cell col-client">' + escapeHTML(p.client || '-') + '</td>';
    row += '<td><span class="badge-status ' + badge + '">' + escapeHTML(p.status) + '</span></td>';
    row += '<td><div class="proj-inline-progress"><div class="progress-bar-bg" style="min-width:50px"><div class="progress-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div><span>' + pct + '%</span></div></td>';
    row += '<td class="col-team">' + teamHtml + '</td>';
    row += '<td style="font-size:.7rem;white-space:nowrap">' + escapeHTML(target) + '</td>';
    row += '<td onclick="event.stopPropagation()">';
    if (isMDorHR) {
      row += '<button class="proj-action-btn" onclick="editProject(' + p.id + ')" title="Edit">&#9998;</button>';
      if (isMD) row += '<button class="proj-action-btn danger" onclick="deleteProject(' + p.id + ')" title="Delete">&#128465;</button>';
    }
    row += '</td></tr>';
    return row;
  }

  // Split into My Projects and Other Projects
  var myProjects = projects.filter(function(p) { return currentUser && p.team && p.team.indexOf(currentUser.code) !== -1; });
  var otherProjects = projects.filter(function(p) { return !currentUser || !p.team || p.team.indexOf(currentUser.code) === -1; });

  if (projects.length === 0) {
    html += '<div class="nf-empty" style="margin-top:24px">No projects yet. Click "+ New Project" to get started.</div>';
  } else {
    html += '<div style="overflow-x:auto"><table class="proj-listing-table">';
    html += '<thead><tr><th>#</th><th>Project</th><th class="col-client">Client</th><th>Status</th><th>Progress</th><th class="col-team">Team</th><th>Target</th><th>Actions</th></tr></thead>';
    html += '<tbody>';
    if (myProjects.length > 0) {
      html += '<tr class="proj-section-row"><td colspan="8">My Projects</td></tr>';
      myProjects.forEach(function(p, i) { html += buildProjectRow(p, i); });
    }
    if (otherProjects.length > 0) {
      html += '<tr class="proj-section-row"><td colspan="8">Other Projects</td></tr>';
      otherProjects.forEach(function(p, i) { html += buildProjectRow(p, myProjects.length + i); });
    }
    html += '</tbody></table></div>';
  }
  container.innerHTML = html;

  // Staff Deployment grid
  if (grid) {
    var deptCounts = {};
    EMPLOYEES.forEach(function(e) {
      if (e.status === 'Inactive') return;
      var dept = e.dept || 'Other';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    var gridHtml = '';
    gridHtml += '<div class="dept-card office"><div class="dept-name">Design</div><div class="dept-amount">' + (deptCounts['Design'] || 0) + '</div><div class="dept-count">Designing team</div></div>';
    gridHtml += '<div class="dept-card site"><div class="dept-name">Marketing</div><div class="dept-amount">' + (deptCounts['Marketing'] || 0) + '</div><div class="dept-count">Marketing team</div></div>';
    gridHtml += '<div class="dept-card factory"><div class="dept-name">Execution</div><div class="dept-amount">' + (deptCounts['Execution'] || 0) + '</div><div class="dept-count">Site execution</div></div>';
    gridHtml += '<div class="dept-card office"><div class="dept-name">Production</div><div class="dept-amount">' + (deptCounts['Production'] || 0) + '</div><div class="dept-count">Factory production</div></div>';
    gridHtml += '<div class="dept-card site"><div class="dept-name">QS</div><div class="dept-amount">' + (deptCounts['QS'] || 0) + '</div><div class="dept-count">Quantity surveyors</div></div>';
    gridHtml += '<div class="dept-card factory"><div class="dept-name">Admin</div><div class="dept-amount">' + (deptCounts['Admin'] || 0) + '</div><div class="dept-count">Admin & support</div></div>';
    gridHtml += '<div class="dept-card garden"><div class="dept-name">Accounts</div><div class="dept-amount">' + (deptCounts['Accounts'] || 0) + '</div><div class="dept-count">Accounts team</div></div>';
    grid.innerHTML = gridHtml;
  }
}

function filterProjectsTable() {
  var search = (document.getElementById('projSearchInput').value || '').toLowerCase();
  var status = document.getElementById('projStatusFilter').value;
  var rows = document.querySelectorAll('.proj-data-row');
  rows.forEach(function(row) {
    var name = row.getAttribute('data-name') || '';
    var rowStatus = row.getAttribute('data-status') || '';
    var matchName = !search || name.indexOf(search) !== -1;
    var matchStatus = !status || rowStatus === status;
    row.style.display = (matchName && matchStatus) ? '' : 'none';
  });
}

// =====================================================
// MATERIALS TRACKING
// =====================================================
var projectMaterials = [
  { projectId: 1, name: 'TMT Steel Bars', unit: 'MT', total: 50, used: 32, remaining: 18 },
  { projectId: 1, name: 'Cement Bags', unit: 'Bags', total: 500, used: 340, remaining: 160 },
  { projectId: 1, name: 'Sand', unit: 'Cu.ft', total: 200, used: 145, remaining: 55 },
  { projectId: 1, name: 'Bricks', unit: 'Nos', total: 10000, used: 7200, remaining: 2800 },
  { projectId: 2, name: 'TMT Steel Bars', unit: 'MT', total: 80, used: 45, remaining: 35 },
  { projectId: 2, name: 'Cement Bags', unit: 'Bags', total: 800, used: 520, remaining: 280 },
  { projectId: 2, name: 'Ready Mix Concrete', unit: 'Cu.m', total: 300, used: 180, remaining: 120 },
  { projectId: 3, name: 'MS Plates', unit: 'MT', total: 30, used: 18, remaining: 12 },
  { projectId: 3, name: 'Welding Rods', unit: 'Kg', total: 200, used: 140, remaining: 60 },
  { projectId: 3, name: 'Paint', unit: 'Ltr', total: 100, used: 35, remaining: 65 },
  { projectId: 4, name: 'PEB Sections', unit: 'MT', total: 120, used: 75, remaining: 45 },
  { projectId: 4, name: 'Roofing Sheets', unit: 'Sqm', total: 500, used: 320, remaining: 180 },
  { projectId: 4, name: 'Bolts & Nuts', unit: 'Sets', total: 2000, used: 1400, remaining: 600 }
];

function canEditMaterials() {
  if (!currentUser) return false;
  if (currentUser.role === 'MD' || currentUser.role === 'HR') return true;
  var desig = (currentUser.designation || '').toLowerCase();
  return desig.indexOf('coordinator') !== -1 || desig.indexOf('market agent') !== -1;
}

function renderProjectMaterials(proj) {
  var editable = canEditMaterials();
  var mats = projectMaterials.filter(function(m) { return m.projectId === proj.id; });
  var html = '<div style="padding:0 16px">';

  if (editable) {
    html += '<div style="margin-top:10px;margin-bottom:8px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="addMaterialRow(' + proj.id + ')">+ Add Item</button></div>';
  }

  if (mats.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">No materials tracked for this project</div>';
  } else {
    var totalQty = 0, totalUsed = 0, totalRem = 0;
    html += '<table class="materials-proper-table">';
    html += '<thead><tr><th>Material</th><th>Unit</th><th>Total</th><th>Used</th><th>Remaining</th><th>Utilization</th>';
    if (editable) html += '<th style="width:30px"></th>';
    html += '</tr></thead><tbody>';
    mats.forEach(function(m) {
      var globalIdx = projectMaterials.indexOf(m);
      var pctUsed = m.total > 0 ? Math.round((m.used / m.total) * 100) : 0;
      var barColor = pctUsed > 90 ? 'var(--danger)' : pctUsed > 70 ? 'var(--warning)' : 'var(--success)';
      totalQty += m.total; totalUsed += m.used; totalRem += m.remaining;
      html += '<tr>';
      if (editable) {
        html += '<td><input class="mat-input" value="' + escapeHTML(m.name) + '" data-idx="' + globalIdx + '" data-field="name"></td>';
        html += '<td><input class="mat-input mat-input-sm" value="' + escapeHTML(m.unit) + '" data-idx="' + globalIdx + '" data-field="unit" style="text-align:left"></td>';
        html += '<td><input class="mat-input mat-input-sm" type="number" value="' + m.total + '" data-idx="' + globalIdx + '" data-field="total" onchange="updateMaterialRemaining(this)"></td>';
        html += '<td><input class="mat-input mat-input-sm" type="number" value="' + m.used + '" data-idx="' + globalIdx + '" data-field="used" onchange="updateMaterialRemaining(this)"></td>';
        html += '<td class="mat-remaining">' + m.remaining + '</td>';
      } else {
        html += '<td style="font-weight:500">' + escapeHTML(m.name) + '</td>';
        html += '<td style="text-align:left">' + escapeHTML(m.unit) + '</td>';
        html += '<td>' + m.total + '</td>';
        html += '<td>' + m.used + '</td>';
        html += '<td class="mat-remaining">' + m.remaining + '</td>';
      }
      html += '<td><div style="display:flex;align-items:center;gap:4px;justify-content:flex-end"><span style="font-size:.65rem;min-width:28px;text-align:right">' + pctUsed + '%</span><div class="mat-utilization-bar" style="min-width:40px"><div class="mat-utilization-fill" style="width:' + pctUsed + '%;background:' + barColor + '"></div></div></div></td>';
      if (editable) {
        html += '<td><button class="mat-del-btn" onclick="deleteMaterialRow(' + globalIdx + ',' + proj.id + ')">&times;</button></td>';
      }
      html += '</tr>';
    });
    html += '</tbody>';
    html += '<tfoot><tr><td style="font-weight:700">Totals</td><td></td><td>' + totalQty + '</td><td>' + totalUsed + '</td><td>' + totalRem + '</td><td></td>';
    if (editable) html += '<td></td>';
    html += '</tr></tfoot>';
    html += '</table>';
    if (editable) {
      html += '<button class="nf-btn nf-btn-primary" style="margin-top:10px" onclick="saveProjectMaterials(' + proj.id + ')">Save Materials</button>';
    }
  }
  html += '</div>';
  return html;
}

function updateMaterialRemaining(input) {
  var idx = parseInt(input.getAttribute('data-idx'), 10);
  var field = input.getAttribute('data-field');
  projectMaterials[idx][field] = parseFloat(input.value) || 0;
  projectMaterials[idx].remaining = projectMaterials[idx].total - projectMaterials[idx].used;
  // Update the remaining display — works with both old .materials-row and new <tr>
  var row = input.closest('tr') || input.closest('.materials-row');
  if (row) {
    var rem = row.querySelector('.mat-remaining');
    if (rem) rem.textContent = projectMaterials[idx].remaining;
  }
}

async function saveProjectMaterials(projectId) {
  var container = document.getElementById('projectDetailContent');
  if (!container) return;
  var inputs = container.querySelectorAll('.mat-input');
  inputs.forEach(function(inp) {
    var idx = parseInt(inp.getAttribute('data-idx'), 10);
    var field = inp.getAttribute('data-field');
    if (field === 'total' || field === 'used') {
      projectMaterials[idx][field] = parseFloat(inp.value) || 0;
      projectMaterials[idx].remaining = projectMaterials[idx].total - projectMaterials[idx].used;
    } else {
      projectMaterials[idx][field] = inp.value.trim();
    }
  });
  try {
    var mats = projectMaterials.filter(function(m) { return m.projectId === projectId; });
    await apiCall('POST', '/projects/' + projectId + '/materials/bulk', { materials: mats });
    showToast('Materials saved');
    await refreshProject(projectId);
  } catch(e) { showToast('Error saving materials'); }
}

function addMaterialRow(projectId) {
  projectMaterials.push({ projectId: projectId, name: '', unit: '', total: 0, used: 0, remaining: 0 });
  var proj = projects.find(function(p){return p.id===projectId;});
  if (proj) renderProjectDetailContent(proj);
}

async function deleteMaterialRow(idx, projectId) {
  projectMaterials.splice(idx, 1);
  try {
    var mats = projectMaterials.filter(function(m) { return m.projectId === projectId; });
    await apiCall('POST', '/projects/' + projectId + '/materials/bulk', { materials: mats });
    await refreshProject(projectId);
  } catch(e) { showToast('Error deleting material'); }
}

function openProjectForm(editId) {
  var isMDorHR = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  if (!isMDorHR) { showToast('Access denied'); return; }
  var proj = editId ? projects.find(function(p){return p.id===editId;}) : null;
  var container = document.getElementById('projectsList');
  if (!container) return;

  var statusOpts = PROJECT_STATUSES.map(function(s) {
    return '<option value="' + s + '"' + (proj && proj.status === s ? ' selected' : '') + '>' + s + '</option>';
  }).join('');

  var html = '<div class="card" style="padding:16px;margin-top:10px;border-left:4px solid var(--primary)">';
  html += '<div class="nf-section-title">' + (proj ? 'Edit Project' : 'New Project') + '</div>';
  html += '<div class="form-group"><label class="form-label">Project Name *</label><input class="form-control" id="projName" value="' + (proj ? escapeHTML(proj.name) : '') + '"></div>';
  html += '<div class="form-group"><label class="form-label">Client</label><input class="form-control" id="projClient" value="' + (proj ? escapeHTML(proj.client) : '') + '"></div>';
  html += '<div class="form-group"><label class="form-label">Location</label><input class="form-control" id="projLocation" value="' + (proj ? escapeHTML(proj.location) : '') + '"></div>';
  html += '<div class="form-group"><label class="form-label">Budget (Rs.)</label><input class="form-control" type="number" id="projBudget" value="' + (proj ? proj.budget : '') + '"></div>';
  html += '<div class="form-group"><label class="form-label">Contractor</label><input class="form-control" id="projContractor" value="' + (proj ? escapeHTML(proj.contractorName || '') : 'Swetha Structures Pvt Ltd') + '"></div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<div class="form-group" style="flex:1"><label class="form-label">Site Location</label><input class="form-control" id="projSiteLocation" value="' + (proj ? escapeHTML(proj.siteLocation || '') : '') + '"></div>';
  html += '<div class="form-group" style="flex:1"><label class="form-label">Project Lead</label><input class="form-control" id="projLead" value="' + (proj ? escapeHTML(proj.projectLead || '') : '') + '"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<div class="form-group" style="flex:1"><label class="form-label">Start Date</label><input class="form-control" type="date" id="projStart" value="' + (proj ? proj.startDate : '') + '"></div>';
  html += '<div class="form-group" style="flex:1"><label class="form-label">Target Date</label><input class="form-control" type="date" id="projTarget" value="' + (proj ? proj.targetDate : '') + '"></div>';
  html += '</div>';
  html += '<div class="form-group"><label class="form-label">Status</label><select class="form-control" id="projStatus">' + statusOpts + '</select></div>';
  html += '<div style="display:flex;gap:8px;margin-top:10px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="saveProject(' + (editId || 0) + ')">Save Project</button>';
  html += '<button class="nf-btn nf-btn-secondary" onclick="renderProgressScreen()">Cancel</button>';
  html += '</div></div>';

  // Show form at top, then existing cards
  var existingCards = container.innerHTML;
  container.innerHTML = html;
}

async function saveProject(editId) {
  var name = document.getElementById('projName').value.trim();
  if (!name) { showToast('Project name is required'); return; }
  var data = {
    name: name,
    client: document.getElementById('projClient').value.trim(),
    location: document.getElementById('projLocation').value.trim(),
    budget: parseFloat(document.getElementById('projBudget').value) || 0,
    startDate: document.getElementById('projStart').value,
    targetDate: document.getElementById('projTarget').value,
    status: document.getElementById('projStatus').value,
    contractorName: document.getElementById('projContractor').value.trim(),
    siteLocation: document.getElementById('projSiteLocation').value.trim(),
    projectLead: document.getElementById('projLead').value.trim()
  };

  try {
    if (editId) {
      await apiCall('PUT', '/projects/' + editId, data);
      showToast('Project updated');
    } else {
      await apiCall('POST', '/projects', data);
      showToast('Project created');
    }
    // Refresh all projects from DB
    var projData = await apiCall('GET', '/projects');
    if (projData && Array.isArray(projData)) {
      projects.length = 0;
      projData.map(mapProject).forEach(function(p) { projects.push(p); });
      projectNextId = projects.reduce(function(mx, p) { return Math.max(mx, p.id || 0); }, 0) + 1;
      Object.keys(projectTaskNextIds).forEach(function(k) { delete projectTaskNextIds[k]; });
      projects.forEach(function(p) {
        var maxTaskId = (p.tasks || []).reduce(function(mx, t) { return Math.max(mx, t.id || 0); }, 0);
        projectTaskNextIds[p.id] = maxTaskId + 1;
      });
      projectMaterials.length = 0;
      projects.forEach(function(p) {
        (p.materials || []).forEach(function(m) { projectMaterials.push(m); });
      });
    }
  } catch (e) {
    showToast('Error saving project');
  }
  renderProgressScreen();
}

async function deleteProject(id) {
  if (!currentUser || currentUser.role !== 'MD') { showToast('Only MD can delete projects'); return; }
  if (isTemporaryMD()) { showToast('Temporary MD does not have delete permissions'); return; }
  if (!confirm('Delete this project permanently?')) return;
  try {
    await apiCall('DELETE', '/projects/' + id);
    // Refresh projects from DB
    var projData = await apiCall('GET', '/projects');
    if (projData && Array.isArray(projData)) {
      projects.length = 0;
      projData.map(mapProject).forEach(function(p) { projects.push(p); });
      projectMaterials.length = 0;
      projects.forEach(function(p) {
        (p.materials || []).forEach(function(m) { projectMaterials.push(m); });
      });
    }
    showToast('Project deleted');
  } catch (e) { showToast('Error deleting project'); }
  hideOverlay('project-detail');
  renderProgressScreen();
}

// Refresh a single project from DB and re-render detail
async function refreshProject(projectId) {
  try {
    var projData = await apiCall('GET', '/projects');
    if (projData && Array.isArray(projData)) {
      projects.length = 0;
      projData.map(mapProject).forEach(function(p) { projects.push(p); });
      projectMaterials.length = 0;
      projects.forEach(function(p) {
        (p.materials || []).forEach(function(m) { projectMaterials.push(m); });
      });
    }
    var proj = projects.find(function(p){return p.id===projectId;});
    if (proj) renderProjectDetailContent(proj);
  } catch(e) {}
}

async function showProjectDetail(id) {
  var proj = projects.find(function(p){return p.id===id;});
  if (!proj) return;
  document.getElementById('projectDetailTitle').textContent = proj.name;
  currentProjectTab = 'overview';
  showOverlay('project-detail');
  // Always refresh WBS tasks from DB to ensure fresh data
  try {
    var wbsData = await apiCall('GET', '/sitetrack/projects/' + id + '/wbs');
    proj.wbsTasks = (wbsData || []).map(mapWBSTask);
  } catch(e) {}
  renderProjectDetailContent(proj);
}

function renderProjectDetailContent(proj) {
  var c = document.getElementById('projectDetailContent');
  if (!c) return;
  var isMDorHR = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  var isMD = currentUser && currentUser.role === 'MD';
  var pct = getProjectProgress(proj);
  var hasWBS = proj.wbsTasks && proj.wbsTasks.length > 0;
  var findProj = 'projects.find(function(p){return p.id===' + proj.id + ';})';

  // Tabs
  var matCount = projectMaterials.filter(function(m){return m.projectId===proj.id;}).length;
  function tabBtn(key, label, count) {
    var cls = 'proj-detail-tab' + (currentProjectTab===key?' active':'');
    var countBadge = typeof count === 'number' ? '<span class="tab-count">' + count + '</span>' : '';
    return '<button class="' + cls + '" onclick="currentProjectTab=\'' + key + '\';renderProjectDetailContent(' + findProj + ')">' + label + countBadge + '</button>';
  }
  var html = '<div class="proj-detail-tabs">';
  html += tabBtn('overview', 'Overview');
  if (hasWBS || isMDorHR) html += tabBtn('wbs', 'WBS', hasWBS ? proj.wbsTasks.length : undefined);
  html += tabBtn('boq', 'BOQ');
  html += tabBtn('gantt', 'Gantt');
  html += tabBtn('dailylog', 'Daily Log');
  if (!hasWBS) html += tabBtn('tasks', 'Tasks', proj.tasks.length);
  html += tabBtn('team', 'Team', proj.team.length);
  html += tabBtn('materials', 'Materials', matCount);
  html += '</div>';

  if (currentProjectTab === 'overview') {
    html += renderProjectOverview(proj, pct, isMDorHR, isMD);
  } else if (currentProjectTab === 'wbs') {
    html += renderProjectWBS(proj, isMDorHR);
  } else if (currentProjectTab === 'boq') {
    html += renderProjectBOQ(proj, isMDorHR);
  } else if (currentProjectTab === 'gantt') {
    html += renderProjectGantt(proj);
  } else if (currentProjectTab === 'dailylog') {
    html += renderProjectDailyLogs(proj, isMDorHR);
  } else if (currentProjectTab === 'tasks') {
    html += renderProjectTasks(proj, isMDorHR);
  } else if (currentProjectTab === 'team') {
    html += renderProjectTeam(proj, isMDorHR);
  } else if (currentProjectTab === 'materials') {
    html += renderProjectMaterials(proj);
  }

  c.innerHTML = html;
}

function renderProjectOverview(proj, pct, isMDorHR, isMD) {
  var statusColors = {'Not Started':'var(--gray-400)','In Progress':'var(--primary)','On Track':'var(--success)','Delayed':'var(--warning)','Completed':'var(--success)'};
  var html = '<div style="padding:0 16px">';

  // Info card — 2-column grid
  html += '<div class="card" style="padding:14px;margin-top:10px">';
  html += '<div class="proj-overview-header">';
  // Left column: project details
  html += '<div class="proj-overview-info">';
  html += '<div style="font-weight:700;font-size:.9rem;margin-bottom:6px">' + escapeHTML(proj.name) + '</div>';
  html += '<div class="info-row"><strong>Client:</strong> ' + escapeHTML(proj.client || 'N/A') + '</div>';
  html += '<div class="info-row"><strong>Location:</strong> ' + escapeHTML(proj.location || 'N/A') + '</div>';
  if (proj.siteLocation) html += '<div class="info-row"><strong>Site:</strong> ' + escapeHTML(proj.siteLocation) + '</div>';
  html += '<div class="info-row"><strong>Contractor:</strong> ' + escapeHTML(proj.contractorName || 'N/A') + '</div>';
  if (proj.projectLead) html += '<div class="info-row"><strong>Lead:</strong> ' + escapeHTML(proj.projectLead) + '</div>';
  html += '</div>';
  // Right column: numbers
  html += '<div class="proj-overview-numbers">';
  html += '<div style="text-align:right"><span class="badge-status" style="background:' + (statusColors[proj.status]||'var(--gray-400)') + ';color:#fff;padding:3px 10px;border-radius:12px;font-size:.68rem">' + escapeHTML(proj.status) + '</span></div>';
  html += '<div class="info-row" style="justify-content:flex-end"><strong>Budget:</strong> Rs.' + (proj.budget ? proj.budget.toLocaleString('en-IN') : '0') + '</div>';
  html += '<div class="info-row" style="justify-content:flex-end"><strong>Start:</strong> ' + (proj.startDate || 'TBD') + '</div>';
  html += '<div class="info-row" style="justify-content:flex-end"><strong>Target:</strong> ' + (proj.targetDate || 'TBD') + '</div>';
  html += '</div>';
  html += '</div></div>';

  // Progress
  var hasWBS = proj.wbsTasks && proj.wbsTasks.length > 0;
  html += '<div class="card" style="padding:14px;margin-top:10px">';
  html += '<div style="font-weight:600;font-size:.82rem;margin-bottom:8px">Progress</div>';
  html += '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%;background:linear-gradient(90deg,var(--primary),var(--primary-light))"></div></div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--gray-500);margin-top:4px">';
  html += '<span>' + pct + '% Complete</span>';
  if (hasWBS) {
    html += '<span>' + proj.wbsTasks.filter(function(t){return t.status==='completed';}).length + ' of ' + proj.wbsTasks.length + ' WBS tasks done</span>';
  } else {
    html += '<span>' + proj.tasks.filter(function(t){return t.status==='Done';}).length + ' of ' + proj.tasks.length + ' tasks done</span>';
  }
  html += '</div></div>';

  // Task summary — colored stat boxes
  var pending, inProg, done, totalTasks, summaryLabel;
  if (hasWBS) {
    pending = proj.wbsTasks.filter(function(t){return t.status==='pending';}).length;
    inProg = proj.wbsTasks.filter(function(t){return t.status==='in_progress';}).length;
    done = proj.wbsTasks.filter(function(t){return t.status==='completed';}).length;
    totalTasks = proj.wbsTasks.length;
    summaryLabel = 'WBS Task Summary';
  } else {
    pending = proj.tasks.filter(function(t){return t.status==='Pending';}).length;
    inProg = proj.tasks.filter(function(t){return t.status==='In Progress';}).length;
    done = proj.tasks.filter(function(t){return t.status==='Done';}).length;
    totalTasks = proj.tasks.length;
    summaryLabel = 'Task Summary';
  }
  html += '<div style="margin-top:10px">';
  html += '<div style="font-weight:600;font-size:.82rem;margin-bottom:8px">' + summaryLabel + ' <span style="font-size:.68rem;color:var(--gray-400);font-weight:400">(' + totalTasks + ' total)</span></div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<div class="proj-task-stat stat-pending"><div class="stat-num" style="color:var(--warning)">' + pending + '</div><div class="stat-label">Pending</div></div>';
  html += '<div class="proj-task-stat stat-inprogress"><div class="stat-num" style="color:var(--primary)">' + inProg + '</div><div class="stat-label">In Progress</div></div>';
  html += '<div class="proj-task-stat stat-done"><div class="stat-num" style="color:var(--success)">' + done + '</div><div class="stat-label">' + (hasWBS ? 'Completed' : 'Done') + '</div></div>';
  html += '</div>';

  // WBS level breakdown — show L1 parent tasks with their progress
  if (hasWBS) {
    var l1Tasks = proj.wbsTasks.filter(function(t){return t.level === 1;});
    if (l1Tasks.length > 0) {
      html += '<div style="margin-top:12px">';
      html += '<div style="font-size:.72rem;font-weight:600;color:var(--gray-500);margin-bottom:6px">WBS Breakdown</div>';
      l1Tasks.forEach(function(t) {
        var statusColor = t.status === 'completed' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--primary)' : 'var(--warning)';
        var statusLabel = t.status === 'completed' ? 'Done' : t.status === 'in_progress' ? 'Active' : 'Pending';
        var childTasks = proj.wbsTasks.filter(function(c){return c.level > 1 && c.wbsCode.indexOf(t.wbsCode + '.') === 0;});
        var childDone = childTasks.filter(function(c){return c.status === 'completed';}).length;
        var avgProgress = childTasks.length > 0
          ? Math.round(childTasks.reduce(function(s,c){return s+c.progressPct;}, 0) / childTasks.length)
          : Math.round(t.progressPct);

        html += '<div class="wbs-breakdown-item">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
        html += '<span style="font-size:.72rem;font-weight:600">' + escapeHTML(t.wbsCode) + ' ' + escapeHTML(t.taskName) + '</span>';
        html += '<span style="font-size:.62rem;padding:2px 8px;border-radius:10px;background:' + statusColor + ';color:#fff">' + statusLabel + '</span>';
        html += '</div>';
        html += '<div class="progress-bar-bg" style="height:10px;border-radius:5px"><div class="progress-bar-fill" style="width:' + avgProgress + '%;background:' + statusColor + ';height:100%;border-radius:5px"></div></div>';
        html += '<div style="display:flex;justify-content:space-between;font-size:.62rem;color:var(--gray-400);margin-top:2px">';
        html += '<span>' + avgProgress + '%</span>';
        if (childTasks.length > 0) html += '<span>' + childDone + '/' + childTasks.length + ' sub-tasks done</span>';
        html += '</div></div>';
      });
      html += '</div>';
    }
  }
  html += '</div>';

  // Actions
  if (isMDorHR) {
    html += '<div style="display:flex;gap:8px;margin-top:12px">';
    html += '<button class="nf-btn nf-btn-secondary" style="flex:1" onclick="editProject(' + proj.id + ')">Edit Project</button>';
    if (isMD) {
      html += '<button class="nf-btn" style="flex:1;background:var(--danger);color:#fff;border:none;border-radius:8px;padding:8px;font-size:.78rem;cursor:pointer" onclick="deleteProject(' + proj.id + ')">Delete</button>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderProjectTasks(proj, isMDorHR) {
  var html = '<div style="padding:0 16px">';

  if (isMDorHR) {
    html += '<div style="margin-top:10px;margin-bottom:8px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openTaskForm(' + proj.id + ')">+ Add Task</button></div>';
  }

  // Task form placeholder
  html += '<div id="projectTaskFormArea"></div>';

  if (proj.tasks.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">No tasks yet</div>';
  } else {
    var priorityColors = {'Low':'var(--gray-400)','Medium':'var(--primary)','High':'var(--warning)','Urgent':'var(--danger)'};
    proj.tasks.forEach(function(task) {
      var isDone = task.status === 'Done';
      var isInProg = task.status === 'In Progress';
      var checkClass = isDone ? 'done' : '';
      var checkIcon = isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '';
      var emp = EMPLOYEES.find(function(e){return e.code === task.assignedTo;});

      html += '<div class="project-task-item">';
      html += '<div class="task-checkbox ' + checkClass + '" onclick="event.stopPropagation();toggleProjectTaskStatus(' + proj.id + ',' + task.id + ')">' + checkIcon + '</div>';
      html += '<div class="task-info">';
      html += '<h4 class="' + (isDone ? 'task-done' : '') + '">' + escapeHTML(task.title) + '</h4>';
      html += '<p>';
      if (emp) html += escapeHTML(emp.name);
      if (task.dueDate) html += (emp ? ' &middot; ' : '') + 'Due: ' + task.dueDate;
      html += '</p></div>';
      html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">';
      html += '<span style="font-size:.6rem;padding:2px 6px;border-radius:8px;background:' + (priorityColors[task.priority]||'var(--gray-300)') + ';color:#fff">' + escapeHTML(task.priority) + '</span>';
      var statusColor = isDone ? 'var(--success)' : isInProg ? 'var(--primary)' : 'var(--warning)';
      html += '<span style="font-size:.6rem;color:' + statusColor + ';font-weight:600">' + escapeHTML(task.status) + '</span>';
      html += '</div></div>';
    });
  }
  html += '</div>';
  return html;
}

function renderProjectTeam(proj, isMDorHR) {
  var html = '<div style="padding:0 16px">';

  if (isMDorHR) {
    html += '<div style="margin-top:10px;margin-bottom:8px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openAddMemberUI(' + proj.id + ')">+ Add Member</button></div>';
  }

  html += '<div id="projectMemberFormArea"></div>';

  var avatarColors = ['#E85D04','#3B82F6','#10B981','#8B5CF6','#EC4899','#F59E0B'];
  if (proj.team.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">No team members assigned</div>';
  } else {
    html += '<table class="proj-team-table">';
    html += '<thead><tr><th>Member</th><th>Code</th><th>Department</th><th>Designation</th>';
    if (isMDorHR) html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    proj.team.forEach(function(code, i) {
      var emp = EMPLOYEES.find(function(e){return e.code === code;});
      if (!emp) return;
      html += '<tr>';
      html += '<td><div class="team-cell"><div class="team-avatar" style="width:28px;height:28px;border-radius:50%;font-size:.6rem;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;background:' + avatarColors[i % avatarColors.length] + '">' + escapeHTML(emp.name.charAt(0)) + '</div><span style="font-weight:600">' + escapeHTML(emp.name) + '</span></div></td>';
      html += '<td style="color:var(--gray-500);font-size:.7rem">' + escapeHTML(emp.code) + '</td>';
      html += '<td>' + escapeHTML(emp.dept || '-') + '</td>';
      html += '<td style="font-size:.7rem">' + escapeHTML(emp.designation || '-') + '</td>';
      if (isMDorHR) {
        html += '<td><button class="proj-action-btn danger" onclick="event.stopPropagation();removeProjectMember(' + proj.id + ',\'' + code + '\')">Remove</button></td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  return html;
}

// =====================================================
// SITETRACK: WBS TAB
// =====================================================
function isCurrentUserWBSLead(task) {
  if (!currentUser || !task.lead) return false;
  return task.lead === currentUser.name;
}

function renderProjectWBS(proj, isMDorHR) {
  var isMD = currentUser && currentUser.role === 'MD';
  var html = '<div style="padding:0 16px">';
  if (isMD) {
    html += '<div style="margin-top:10px;margin-bottom:8px;display:flex;gap:8px">';
    html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openWBSTaskForm(' + proj.id + ')">+ Add WBS Task</button>';
    html += '</div>';
  }
  html += '<div id="wbsTaskFormArea"></div>';
  html += '<div id="wbsContent"><div class="nf-empty" style="margin-top:16px"><span class="spinner"></span> Loading WBS...</div></div>';
  html += '</div>';
  // Load WBS fresh from DB
  setTimeout(function() { loadProjectWBS(proj.id, isMDorHR); }, 50);
  return html;
}

async function loadProjectWBS(projectId, isMDorHR) {
  var container = document.getElementById('wbsContent');
  if (!container) return;
  try {
    var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
    var proj = projects.find(function(p){return p.id===projectId;});
    if (proj) proj.wbsTasks = (wbsData || []).map(mapWBSTask);
    var tasks = proj ? proj.wbsTasks : (wbsData || []).map(mapWBSTask);
    renderWBSTable(container, tasks, proj, isMDorHR, projectId);
  } catch(e) {
    container.innerHTML = '<div class="nf-empty">Error loading WBS data</div>';
  }
}

function renderWBSTable(container, tasks, proj, isMDorHR, projectId) {
  var html = '';
  var isMD = currentUser && currentUser.role === 'MD';
  if (!tasks || tasks.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">No WBS tasks yet. Add tasks or import from Excel BOQ.</div>';
  } else {
    var doneCount = tasks.filter(function(t){return t.status==='completed';}).length;
    html += '<div class="wbs-table-wrap">';
    html += '<div class="wbs-table-title"><h4>Work Breakdown Structure</h4><span class="wbs-count">' + doneCount + ' / ' + tasks.length + ' completed</span></div>';
    html += '<div style="overflow-x:auto"><table class="wbs-table">';
    html += '<thead><tr><th class="wbs-col-code">Code</th><th class="wbs-col-task">Task Name</th><th class="wbs-col-lead">Lead</th><th class="wbs-col-date wbs-col-hide-mobile">Plan Start</th><th class="wbs-col-date wbs-col-hide-mobile">Plan End</th><th class="wbs-col-date wbs-col-hide-mobile">Act. Start</th><th class="wbs-col-date wbs-col-hide-mobile">Act. End</th><th class="wbs-col-days wbs-col-hide-mobile">P.Days</th><th class="wbs-col-days wbs-col-hide-mobile">W.Days</th><th class="wbs-col-prog">Progress</th><th class="wbs-col-status">Status</th>';
    if (isMD) html += '<th class="wbs-col-del"></th>';
    html += '</tr></thead><tbody>';

    tasks.forEach(function(t) {
      var statusColor = t.status === 'completed' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--primary)' : 'var(--warning)';
      var statusLabel = t.status === 'completed' ? 'Done' : t.status === 'in_progress' ? 'In Progress' : 'Pending';
      var statusClass = t.status === 'completed' ? 'status-done' : t.status === 'in_progress' ? 'status-inprogress' : 'status-pending';
      var isLead = isCurrentUserWBSLead(t);
      html += '<tr class="wbs-level-' + t.level + '">';
      // Code — always read-only
      html += '<td class="wbs-col-code">' + escapeHTML(t.wbsCode) + '</td>';
      // Task Name — MD editable
      if (isMD) {
        html += '<td class="wbs-col-task wbs-editable" onclick="wbsEditCell(this,' + t.id + ',\'taskName\',\'text\',' + projectId + ')">' + escapeHTML(t.taskName) + '</td>';
      } else {
        html += '<td class="wbs-col-task">' + escapeHTML(t.taskName) + '</td>';
      }
      // Lead — MD editable (2-stage dept→employee)
      if (isMD) {
        html += '<td class="wbs-col-lead wbs-editable" onclick="wbsEditLeadCell(this,' + t.id + ',' + projectId + ')">' + escapeHTML(t.lead || '-') + '</td>';
      } else {
        html += '<td class="wbs-col-lead">' + escapeHTML(t.lead || '-') + '</td>';
      }
      // Plan Start / Plan End — MD editable
      if (isMD) {
        html += '<td class="wbs-col-date wbs-col-hide-mobile wbs-editable" onclick="wbsEditCell(this,' + t.id + ',\'startDate\',\'date\',' + projectId + ')">' + (t.startDate || '-') + '</td>';
        html += '<td class="wbs-col-date wbs-col-hide-mobile wbs-editable" onclick="wbsEditCell(this,' + t.id + ',\'endDate\',\'date\',' + projectId + ')">' + (t.endDate || '-') + '</td>';
      } else {
        html += '<td class="wbs-col-date wbs-col-hide-mobile">' + (t.startDate || '-') + '</td>';
        html += '<td class="wbs-col-date wbs-col-hide-mobile">' + (t.endDate || '-') + '</td>';
      }
      // Act. Start — Lead editable (one-time, only when empty)
      if (isLead && !t.actualStart) {
        html += '<td class="wbs-col-date wbs-col-hide-mobile wbs-lead-editable" onclick="wbsEditCell(this,' + t.id + ',\'actualStart\',\'date\',' + projectId + ')"><span style="opacity:0.5">— tap</span></td>';
      } else {
        html += '<td class="wbs-col-date wbs-col-hide-mobile">' + (t.actualStart || '-') + '</td>';
      }
      // Act. End — Lead editable (one-time, only when empty)
      if (isLead && !t.actualEnd) {
        html += '<td class="wbs-col-date wbs-col-hide-mobile wbs-lead-editable" onclick="wbsEditCell(this,' + t.id + ',\'actualEnd\',\'date\',' + projectId + ')"><span style="opacity:0.5">— tap</span></td>';
      } else {
        html += '<td class="wbs-col-date wbs-col-hide-mobile">' + (t.actualEnd || '-') + '</td>';
      }
      // P.Days — Lead editable (one-time, only when empty)
      if (isLead && !t.plannedDays) {
        html += '<td class="wbs-col-days wbs-col-hide-mobile wbs-lead-editable" onclick="wbsEditCell(this,' + t.id + ',\'plannedDays\',\'number\',' + projectId + ')"><span style="opacity:0.5">— tap</span></td>';
      } else {
        html += '<td class="wbs-col-days wbs-col-hide-mobile">' + (t.plannedDays || '-') + '</td>';
      }
      // W.Days — Lead editable (one-time, only when empty)
      if (isLead && !t.workDays) {
        html += '<td class="wbs-col-days wbs-col-hide-mobile wbs-lead-editable" onclick="wbsEditCell(this,' + t.id + ',\'workDays\',\'number\',' + projectId + ')"><span style="opacity:0.5">— tap</span></td>';
      } else {
        html += '<td class="wbs-col-days wbs-col-hide-mobile">' + (t.workDays || '-') + '</td>';
      }
      // Progress — clickable by all
      html += '<td class="wbs-col-prog"><div class="wbs-prog-bar" onclick="promptWBSProgress(' + t.id + ',' + t.progressPct + ',' + projectId + ')" style="cursor:pointer"><div class="wbs-prog-fill" style="width:' + t.progressPct + '%;background:' + statusColor + '"></div><span class="wbs-prog-text">' + Math.round(t.progressPct) + '%</span></div></td>';
      // Status — read-only
      html += '<td class="wbs-col-status"><span class="wbs-status-badge ' + statusClass + '">' + statusLabel + '</span></td>';
      // Delete — MD only
      if (isMD) {
        html += '<td class="wbs-col-del"><button class="proj-action-btn danger" onclick="deleteWBSTask(' + t.id + ',' + projectId + ')" title="Delete">Del</button></td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
  }
  container.innerHTML = html;
}

function getWBSDeptOptions() {
  var depts = {};
  EMPLOYEES.forEach(function(e) { if (e.status !== 'Inactive' && e.dept) depts[e.dept] = true; });
  var html = '<option value="">-- Select Dept --</option>';
  Object.keys(depts).sort().forEach(function(d) { html += '<option value="' + escapeHTML(d) + '">' + escapeHTML(d) + '</option>'; });
  return html;
}

function onWBSDeptChange(selectId, empSelectId) {
  var dept = document.getElementById(selectId).value;
  var empSel = document.getElementById(empSelectId);
  if (!empSel) return;
  var html = '<option value="">-- Select Employee --</option>';
  if (dept) {
    EMPLOYEES.filter(function(e) { return e.status !== 'Inactive' && e.dept === dept; })
      .sort(function(a, b) { return a.name.localeCompare(b.name); })
      .forEach(function(e) { html += '<option value="' + escapeHTML(e.name) + '">' + escapeHTML(e.name) + ' (' + e.code + ')</option>'; });
  }
  empSel.innerHTML = html;
}

function openWBSTaskForm(projectId) {
  var area = document.getElementById('wbsTaskFormArea');
  if (!area) return;
  var deptOpts = getWBSDeptOptions();
  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Add WBS Task</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">WBS Code *</label><input class="form-control" id="wbsCode" placeholder="1.1"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Level</label><select class="form-control" id="wbsLevel"><option value="1">Level 1</option><option value="2" selected>Level 2</option><option value="3">Level 3</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Task Name *</label><input class="form-control" id="wbsTaskName"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Lead — Department</label><select class="form-control" id="wbsLeadDept" onchange="onWBSDeptChange(\'wbsLeadDept\',\'wbsLeadEmp\')">' + deptOpts + '</select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Lead — Employee</label><select class="form-control" id="wbsLeadEmp"><option value="">-- Select Dept first --</option></select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Planned Days</label><input class="form-control" type="number" id="wbsPlannedDays"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Start Date</label><input class="form-control" type="date" id="wbsStart"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">End Date</label><input class="form-control" type="date" id="wbsEnd"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveWBSTask(' + projectId + ')">Add</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="document.getElementById(\'wbsTaskFormArea\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function saveWBSTask(projectId) {
  var code = document.getElementById('wbsCode').value.trim();
  var name = document.getElementById('wbsTaskName').value.trim();
  if (!code || !name) { showToast('WBS code and task name are required'); return; }
  try {
    await apiCall('POST', '/sitetrack/projects/' + projectId + '/wbs', {
      wbsCode: code,
      level: parseInt(document.getElementById('wbsLevel').value, 10) || 1,
      taskName: name,
      lead: document.getElementById('wbsLeadEmp').value || '',
      plannedDays: parseInt(document.getElementById('wbsPlannedDays').value, 10) || null,
      startDate: document.getElementById('wbsStart').value || null,
      endDate: document.getElementById('wbsEnd').value || null
    });
    // Refresh WBS from DB
    var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
    var proj = projects.find(function(p){return p.id===projectId;});
    if (proj) {
      proj.wbsTasks = (wbsData || []).map(mapWBSTask);
      showToast('WBS task added');
      renderProjectDetailContent(proj);
    }
  } catch (e) { showToast('Error adding WBS task'); }
}

function promptWBSProgress(taskId, currentPct, projectId) {
  var newPct = prompt('Update progress (0-100):', Math.round(currentPct));
  if (newPct === null) return;
  newPct = parseFloat(newPct);
  if (isNaN(newPct) || newPct < 0 || newPct > 100) { showToast('Enter a value between 0 and 100'); return; }
  updateWBSProgress(taskId, newPct, projectId);
}

async function updateWBSProgress(taskId, pct, projectId) {
  try {
    await apiCall('PATCH', '/sitetrack/wbs/' + taskId + '/progress', { progressPct: pct });
    // Refresh WBS from DB
    var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
    var proj = projects.find(function(p){return p.id===projectId;});
    if (proj) {
      proj.wbsTasks = (wbsData || []).map(mapWBSTask);
      showToast('Progress updated');
      renderProjectDetailContent(proj);
    }
  } catch (e) { showToast('Error updating progress'); }
}

async function deleteWBSTask(taskId, projectId) {
  if (!confirm('Delete this WBS task?')) return;
  try {
    await apiCall('DELETE', '/sitetrack/wbs/' + taskId);
    // Refresh WBS from DB
    var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
    var proj = projects.find(function(p){return p.id===projectId;});
    if (proj) {
      proj.wbsTasks = (wbsData || []).map(mapWBSTask);
      showToast('WBS task deleted');
      renderProjectDetailContent(proj);
    }
  } catch (e) { showToast('Error deleting task'); }
}

// =====================================================
// SITETRACK: BOQ TAB
// =====================================================
function renderProjectBOQ(proj, isMDorHR) {
  var html = '<div style="padding:0 16px">';
  if (isMDorHR) {
    html += '<div style="margin-top:10px;margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap">';
    html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openBOQSheetForm(' + proj.id + ')">+ Add BOQ</button>';
    html += '<button class="nf-btn nf-btn-secondary nf-btn-sm" onclick="showExcelUpload(' + proj.id + ')">Import Excel</button>';
    html += '</div>';
  }
  html += '<div id="boqSheetFormArea"></div>';
  html += '<div id="boqExcelArea"></div>';
  html += '<div id="boqContent"><div class="nf-empty" style="margin-top:16px"><span class="spinner"></span> Loading BOQ...</div></div>';
  html += '</div>';

  // Load BOQ data async
  setTimeout(function() { loadProjectBOQ(proj.id, isMDorHR); }, 50);
  return html;
}

async function loadProjectBOQ(projectId, isMDorHR) {
  var container = document.getElementById('boqContent');
  if (!container) return;
  try {
    var sheets = await apiCall('GET', '/sitetrack/projects/' + projectId + '/boq');
    if (!sheets || sheets.length === 0) {
      container.innerHTML = '<div class="nf-empty" style="margin-top:16px">No BOQ sheets yet. Create a sheet or import from Excel.</div>';
      return;
    }
    var mapped = sheets.map(mapBOQSheet);
    var html = '';

    // Sheet sub-tabs (segmented control)
    html += '<div class="boq-sheet-tabs">';
    mapped.forEach(function(s) {
      var active = currentBOQSheetId === s.id ? ' active' : '';
      if (!currentBOQSheetId && mapped.indexOf(s) === 0) { active = ' active'; currentBOQSheetId = s.id; }
      html += '<button class="boq-sheet-tab' + active + '" onclick="currentBOQSheetId=' + s.id + ';loadProjectBOQ(' + projectId + ',' + isMDorHR + ')">' + escapeHTML(s.title || BOQ_SHEET_LABELS[s.sheetType] || s.sheetType) + '</button>';
    });
    html += '</div>';

    var activeSheet = mapped.find(function(s){return s.id===currentBOQSheetId;}) || mapped[0];
    if (activeSheet) {
      if (isMDorHR) {
        html += '<div style="margin-bottom:8px"><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openBOQItemForm(' + activeSheet.id + ',' + projectId + ')">+ Add Item</button></div>';
      }
      html += '<div id="boqItemFormArea"></div>';

      if (activeSheet.items.length === 0) {
        html += '<div class="nf-empty">No items in this sheet</div>';
      } else {
        var nonCatItems = activeSheet.items.filter(function(i){return !i.isCategory;});
        html += '<div class="boq-table-wrap">';
        html += '<div class="boq-table-title"><h4>' + escapeHTML(activeSheet.title || 'BOQ Sheet') + '</h4><span style="font-size:.68rem;color:var(--gray-400)">' + nonCatItems.length + ' items</span></div>';
        html += '<div style="overflow-x:auto"><table class="boq-table">';
        html += '<thead><tr><th class="col-sno">S.No</th><th class="col-desc">Description</th><th class="col-unit">Unit</th><th class="col-qty">Qty</th><th class="col-rate">Rate</th><th class="col-amt">Amount</th><th class="col-used">Used</th><th class="col-bal">Balance</th>';
        if (isMDorHR) html += '<th class="col-actions">Actions</th>';
        html += '</tr></thead>';
        var canEdit = currentUser && currentUser.role === 'MD';
        var boqTotalPlanned = 0, boqTotalUsed = 0;
        html += '<tbody>';
        activeSheet.items.forEach(function(item) {
          if (item.isCategory) {
            var colSpan = isMDorHR ? 9 : 8;
            html += '<tr class="boq-category"><td colspan="' + colSpan + '">' + escapeHTML(item.description) + '</td></tr>';
            return;
          }
          var balance = item.plannedQty - item.actualQtyUsed;
          var balClass = balance < 0 ? 'delta-over' : balance > 0 ? 'delta-under' : 'delta-exact';
          var isOver = item.plannedQty > 0 && item.actualQtyUsed > item.plannedQty;
          boqTotalPlanned += item.plannedAmount || 0;
          boqTotalUsed += (item.actualQtyUsed * item.rate) || 0;
          html += '<tr class="' + (isOver ? 'boq-overuse' : '') + (item.isPending ? ' boq-pending-row' : '') + '">';
          html += '<td class="col-sno">' + escapeHTML(item.itemNo) + '</td>';
          if (canEdit) {
            html += '<td class="col-desc boq-editable" style="color:#1F2937" onclick="boqEditCell(this,' + item.id + ',\'description\',\'text\',' + projectId + ')">' + escapeHTML(item.description) + '</td>';
            html += '<td class="col-unit boq-editable" onclick="boqEditCell(this,' + item.id + ',\'unit\',\'text\',' + projectId + ')">' + escapeHTML(item.unit) + '</td>';
            html += '<td class="col-qty boq-editable" onclick="boqEditCell(this,' + item.id + ',\'plannedQty\',\'number\',' + projectId + ')">' + item.plannedQty + '</td>';
            html += '<td class="col-rate boq-editable" onclick="boqEditCell(this,' + item.id + ',\'rate\',\'number\',' + projectId + ')">' + item.rate + '</td>';
          } else {
            html += '<td class="col-desc" style="color:#1F2937">' + escapeHTML(item.description) + '</td>';
            html += '<td class="col-unit">' + escapeHTML(item.unit) + '</td>';
            html += '<td class="col-qty">' + item.plannedQty + '</td>';
            html += '<td class="col-rate">' + item.rate + '</td>';
          }
          html += '<td class="col-amt">' + item.plannedAmount.toLocaleString('en-IN') + '</td>';
          html += '<td class="col-used">' + item.actualQtyUsed + '</td>';
          html += '<td class="col-bal"><span class="' + balClass + '">' + balance.toFixed(1) + '</span></td>';
          if (isMDorHR) {
            html += '<td class="col-actions">';
            html += '<button class="boq-action-btn btn-use" onclick="logBOQUsage(' + item.id + ',' + projectId + ')">+Use</button> ';
            html += '<button class="boq-action-btn ' + (item.isPending ? 'btn-pending' : 'btn-mark') + '" onclick="toggleBOQPending(' + item.id + ',' + projectId + ')">' + (item.isPending ? 'Pending' : 'Mark') + '</button>';
            html += '</td>';
          }
          html += '</tr>';
        });
        html += '</tbody>';
        var footColSpan = isMDorHR ? 5 : 5;
        html += '<tfoot><tr><td colspan="' + footColSpan + '" style="text-align:right">Totals</td><td class="col-amt">' + boqTotalPlanned.toLocaleString('en-IN') + '</td><td>' + boqTotalUsed.toLocaleString('en-IN') + '</td><td></td>';
        if (isMDorHR) html += '<td></td>';
        html += '</tr></tfoot>';
        html += '</table></div></div>';
      }
    }
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div class="nf-empty">Error loading BOQ data</div>';
  }
}

function openBOQSheetForm(projectId) {
  var area = document.getElementById('boqSheetFormArea');
  if (!area) return;
  var typeOpts = BOQ_SHEET_TYPES.map(function(t) {
    return '<option value="' + t + '">' + BOQ_SHEET_LABELS[t] + '</option>';
  }).join('');
  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Add BOQ</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Type</label><select class="form-control" id="boqSheetType">' + typeOpts + '</select></div>' +
    '<div class="form-group" style="flex:2"><label class="form-label">Title</label><input class="form-control" id="boqSheetTitle" placeholder="Civil Works"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Area (sqft)</label><input class="form-control" type="number" id="boqArea"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Rate/sqft</label><input class="form-control" type="number" id="boqRate"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveBOQSheet(' + projectId + ')">Create</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="document.getElementById(\'boqSheetFormArea\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function saveBOQSheet(projectId) {
  var title = document.getElementById('boqSheetTitle').value.trim();
  var sheetType = document.getElementById('boqSheetType').value;
  if (!title) title = BOQ_SHEET_LABELS[sheetType] || 'Untitled';
  try {
    var result = await apiCall('POST', '/sitetrack/projects/' + projectId + '/boq', {
      sheetType: sheetType, title: title,
      areaSqft: parseFloat(document.getElementById('boqArea').value) || null,
      quotedRate: parseFloat(document.getElementById('boqRate').value) || null
    });
    currentBOQSheetId = result.id;
    showToast('BOQ sheet created');
    document.getElementById('boqSheetFormArea').innerHTML = '';
    loadProjectBOQ(projectId, true);
  } catch (e) { showToast('Error creating sheet'); }
}

var _boqItemAddCount = 0;
function openBOQItemForm(sheetId, projectId) {
  _boqItemAddCount = 0;
  _renderBOQItemForm(sheetId, projectId);
}
function _renderBOQItemForm(sheetId, projectId) {
  var area = document.getElementById('boqItemFormArea');
  if (!area) return;
  var countLabel = _boqItemAddCount > 0 ? ' <span style="font-size:.68rem;color:var(--success);margin-left:6px">(' + _boqItemAddCount + ' added)</span>' : '';
  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Add BOQ Item' + countLabel + '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Item No</label><input class="form-control" id="boqItemNo" placeholder="1.1"></div>' +
    '<div class="form-group" style="flex:2"><label class="form-label">Description *</label><input class="form-control" id="boqItemDesc"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Unit</label><input class="form-control" id="boqItemUnit" placeholder="Cu.m"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Qty</label><input class="form-control" type="number" id="boqItemQty"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Rate</label><input class="form-control" type="number" id="boqItemRate"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveBOQItem(' + sheetId + ',' + projectId + ',true)">Add & Next</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="saveBOQItem(' + sheetId + ',' + projectId + ',false)">Add & Close</button>' +
    '<button class="nf-btn" style="background:var(--gray-200);color:var(--text);border:none;border-radius:8px;padding:8px 14px;font-size:.78rem;cursor:pointer" onclick="closeBOQItemForm(' + projectId + ')">Done</button>' +
    '</div></div>';
}
function closeBOQItemForm(projectId) {
  document.getElementById('boqItemFormArea').innerHTML = '';
  if (_boqItemAddCount > 0) loadProjectBOQ(projectId, true);
}

async function saveBOQItem(sheetId, projectId, keepOpen) {
  var desc = document.getElementById('boqItemDesc').value.trim();
  if (!desc) { showToast('Description is required'); return; }
  try {
    await apiCall('POST', '/sitetrack/boq/' + sheetId + '/items', {
      itemNo: document.getElementById('boqItemNo').value.trim(),
      description: desc,
      unit: document.getElementById('boqItemUnit').value.trim(),
      plannedQty: parseFloat(document.getElementById('boqItemQty').value) || 0,
      rate: parseFloat(document.getElementById('boqItemRate').value) || 0
    });
    _boqItemAddCount++;
    showToast('Item added (' + _boqItemAddCount + ')');
    if (keepOpen) {
      // Clear fields but keep unit (often same across items)
      var unitVal = document.getElementById('boqItemUnit').value;
      _renderBOQItemForm(sheetId, projectId);
      document.getElementById('boqItemUnit').value = unitVal;
      document.getElementById('boqItemDesc').focus();
    } else {
      document.getElementById('boqItemFormArea').innerHTML = '';
      loadProjectBOQ(projectId, true);
    }
  } catch (e) { showToast('Error adding item'); }
}

function logBOQUsage(itemId, projectId) {
  var qty = prompt('Enter quantity used:');
  if (!qty) return;
  qty = parseFloat(qty);
  if (isNaN(qty) || qty <= 0) { showToast('Enter a positive number'); return; }
  var note = prompt('Note (optional):', '') || '';
  apiCall('POST', '/sitetrack/boq-items/' + itemId + '/usage', { qtyUsed: qty, note: note })
    .then(function() { showToast('Usage logged'); loadProjectBOQ(projectId, true); })
    .catch(function() { showToast('Error logging usage'); });
}

function toggleBOQPending(itemId, projectId) {
  apiCall('PATCH', '/sitetrack/boq-items/' + itemId + '/pending', {})
    .then(function() { showToast('Pending status toggled'); loadProjectBOQ(projectId, true); })
    .catch(function() { showToast('Error toggling pending'); });
}

function boqEditCell(td, itemId, field, inputType, projectId) {
  if (td.querySelector('input,textarea')) return;
  var oldVal = td.textContent.trim();
  var isDesc = field === 'description';
  if (isDesc) {
    var ta = document.createElement('textarea');
    ta.className = 'boq-inline-input';
    ta.value = oldVal;
    ta.rows = 2;
    td.textContent = '';
    td.appendChild(ta);
    ta.focus();
    ta.addEventListener('blur', function() { _boqSaveCell(td, ta.value, oldVal, itemId, field, projectId); });
    ta.addEventListener('keydown', function(e) { if (e.key === 'Escape') { td.textContent = oldVal; } });
  } else {
    var inp = document.createElement('input');
    inp.type = inputType;
    inp.className = 'boq-inline-input';
    inp.value = oldVal;
    td.textContent = '';
    td.appendChild(inp);
    inp.focus();
    inp.select();
    inp.addEventListener('blur', function() { _boqSaveCell(td, inp.value, oldVal, itemId, field, projectId); });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { inp.blur(); }
      if (e.key === 'Escape') { td.textContent = oldVal; }
    });
  }
}
function _boqSaveCell(td, newVal, oldVal, itemId, field, projectId) {
  newVal = newVal.trim();
  if (newVal === oldVal) { td.textContent = oldVal; return; }
  var payload = {};
  payload[field] = field === 'plannedQty' || field === 'rate' ? parseFloat(newVal) || 0 : newVal;
  td.textContent = newVal || oldVal;
  td.style.opacity = '0.6';
  apiCall('PUT', '/sitetrack/boq-items/' + itemId, payload)
    .then(function() { td.style.opacity = '1'; loadProjectBOQ(projectId, true); })
    .catch(function() { td.textContent = oldVal; td.style.opacity = '1'; showToast('Error saving'); });
}

function wbsEditCell(td, taskId, field, inputType, projectId) {
  if (td.querySelector('input')) return;
  var oldVal = td.textContent.trim();
  if (oldVal === '-') oldVal = '';
  var inp = document.createElement('input');
  inp.type = inputType;
  inp.className = 'boq-inline-input';
  inp.value = oldVal;
  td.textContent = '';
  td.appendChild(inp);
  inp.focus();
  if (inputType !== 'date') inp.select();
  inp.addEventListener('blur', function() { _wbsSaveCell(td, inp.value, oldVal, taskId, field, projectId); });
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { inp.blur(); }
    if (e.key === 'Escape') { td.textContent = oldVal || '-'; }
  });
}
function _wbsSaveCell(td, newVal, oldVal, taskId, field, projectId) {
  newVal = newVal.trim();
  if (newVal === oldVal) { td.textContent = oldVal || '-'; return; }
  var payload = {};
  if (field === 'plannedDays' || field === 'workDays') payload[field] = parseInt(newVal, 10) || null;
  else payload[field] = newVal || null;
  td.textContent = newVal || '-';
  td.style.opacity = '0.6';
  apiCall('PUT', '/sitetrack/wbs/' + taskId, payload)
    .then(function() {
      td.style.opacity = '1';
      // Refresh WBS from DB
      return apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
    })
    .then(function(wbsData) {
      var proj = projects.find(function(p){return p.id===projectId;});
      if (proj) {
        proj.wbsTasks = (wbsData || []).map(mapWBSTask);
        renderProjectDetailContent(proj);
      }
    })
    .catch(function() { td.textContent = oldVal || '-'; td.style.opacity = '1'; showToast('Error saving'); });
}

function wbsEditLeadCell(td, taskId, projectId) {
  if (td.querySelector('select')) return;
  var oldVal = td.textContent.trim();
  if (oldVal === '-') oldVal = '';
  td.innerHTML = '';

  // Build 2-stage: dept select + employee select
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px';

  var deptSel = document.createElement('select');
  deptSel.className = 'boq-inline-input';
  deptSel.style.cssText = 'font-size:.68rem;padding:2px 4px';
  deptSel.innerHTML = getWBSDeptOptions();

  var empSel = document.createElement('select');
  empSel.className = 'boq-inline-input';
  empSel.style.cssText = 'font-size:.68rem;padding:2px 4px';
  empSel.innerHTML = '<option value="">-- Select Dept first --</option>';

  // If current lead matches an employee, pre-select
  if (oldVal) {
    var matchEmp = EMPLOYEES.find(function(e) { return e.name === oldVal && e.status !== 'Inactive'; });
    if (matchEmp && matchEmp.dept) {
      deptSel.value = matchEmp.dept;
      // Populate employees for that dept
      var html = '<option value="">-- Select Employee --</option>';
      EMPLOYEES.filter(function(e) { return e.status !== 'Inactive' && e.dept === matchEmp.dept; })
        .sort(function(a, b) { return a.name.localeCompare(b.name); })
        .forEach(function(e) { html += '<option value="' + escapeHTML(e.name) + '">' + escapeHTML(e.name) + ' (' + e.code + ')</option>'; });
      empSel.innerHTML = html;
      empSel.value = oldVal;
    }
  }

  deptSel.addEventListener('change', function() {
    var dept = deptSel.value;
    var html = '<option value="">-- Select Employee --</option>';
    if (dept) {
      EMPLOYEES.filter(function(e) { return e.status !== 'Inactive' && e.dept === dept; })
        .sort(function(a, b) { return a.name.localeCompare(b.name); })
        .forEach(function(e) { html += '<option value="' + escapeHTML(e.name) + '">' + escapeHTML(e.name) + ' (' + e.code + ')</option>'; });
    }
    empSel.innerHTML = html;
  });

  empSel.addEventListener('change', function() {
    if (empSel.value) {
      _wbsSaveCell(td, empSel.value, oldVal, taskId, 'lead', projectId);
    }
  });

  // Close on Escape
  wrap.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { td.textContent = oldVal || '-'; }
  });

  wrap.appendChild(deptSel);
  wrap.appendChild(empSel);
  td.appendChild(wrap);
  deptSel.focus();
}

function showExcelUpload(projectId) {
  var area = document.getElementById('boqExcelArea');
  if (!area) return;
  area.innerHTML = '<div class="card" style="padding:16px;border-left:4px solid var(--primary);margin-bottom:10px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Import BOQ from Excel</div>' +
    '<p style="font-size:.72rem;color:var(--gray-500);margin-bottom:8px">Upload .xlsx with SUMMARY + ABSTRACT sheets. Existing BOQ data will be replaced.</p>' +
    '<div id="boqDropZone" class="excel-drop-zone" onclick="document.getElementById(\'boqFileInput\').click()" ondragover="event.preventDefault();this.classList.add(\'drag-over\')" ondragleave="this.classList.remove(\'drag-over\')" ondrop="handleBOQDrop(event,' + projectId + ')">' +
    '<div style="font-size:1.5rem;margin-bottom:4px">📄</div>' +
    '<div style="font-size:.78rem;font-weight:600">Drop .xlsx file here or click to browse</div>' +
    '</div>' +
    '<input type="file" id="boqFileInput" accept=".xlsx,.xls" style="display:none" onchange="uploadBOQExcel(' + projectId + ',this.files[0])">' +
    '<button class="nf-btn nf-btn-secondary" style="margin-top:8px" onclick="document.getElementById(\'boqExcelArea\').innerHTML=\'\'">Cancel</button>' +
    '</div>';
}

function handleBOQDrop(e, projectId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  var file = e.dataTransfer.files[0];
  if (file) uploadBOQExcel(projectId, file);
}

async function uploadBOQExcel(projectId, file) {
  if (!file) return;
  var ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'xlsx' && ext !== 'xls') { showToast('Only .xlsx files are supported'); return; }
  if (!confirm('This will replace ALL existing BOQ and WBS data for this project. Continue?')) return;

  var formData = new FormData();
  formData.append('file', file);

  try {
    var resp = await fetch(API_BASE + '/sitetrack/projects/' + projectId + '/import-boq', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + JWT_TOKEN },
      body: formData
    });
    var result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Upload failed');
    var msg = 'Imported ' + result.sheetsImported + ' BOQ sheets';
    if (result.wbsTasksCreated) msg += ' + ' + result.wbsTasksCreated + ' WBS tasks';
    showToast(msg);
    document.getElementById('boqExcelArea').innerHTML = '';
    currentBOQSheetId = null;
    // Reload WBS tasks into project object
    try {
      var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
      var proj = projects.find(function(p){return p.id===projectId;});
      if (proj) proj.wbsTasks = (wbsData || []).map(mapWBSTask);
    } catch(e2){}
    loadProjectBOQ(projectId, true);
  } catch (e) { showToast('Error: ' + e.message); }
}

// =====================================================
// SITETRACK: GANTT TAB
// =====================================================
function renderProjectGantt(proj) {
  var html = '<div style="padding:0 16px">';
  var tasks = (proj.wbsTasks && proj.wbsTasks.length > 0) ? proj.wbsTasks : [];

  if (tasks.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">Add WBS tasks with start/end dates to see the Gantt chart.</div>';
    html += '</div>';
    return html;
  }
  html += '<div class="gantt-card-wrapper">';

  // Find date range
  var allDates = [];
  tasks.forEach(function(t) {
    if (t.startDate) allDates.push(new Date(t.startDate));
    if (t.endDate) allDates.push(new Date(t.endDate));
    if (t.actualStart) allDates.push(new Date(t.actualStart));
    if (t.actualEnd) allDates.push(new Date(t.actualEnd));
  });

  if (allDates.length === 0) {
    html += '<div class="nf-empty" style="margin-top:16px">No dates set on WBS tasks for Gantt chart.</div>';
    html += '</div>';
    return html;
  }

  var minDate = new Date(Math.min.apply(null, allDates));
  var maxDate = new Date(Math.max.apply(null, allDates));
  // Pad by 1 week
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  var totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  var totalWeeks = Math.ceil(totalDays / 7);
  if (totalWeeks < 2) totalWeeks = 2;

  // Week headers
  html += '<div class="gantt-container">';
  html += '<div class="gantt-header-row">';
  html += '<div class="gantt-name-col" style="font-weight:700;font-size:.7rem">Task</div>';
  html += '<div class="gantt-weeks-col">';
  for (var w = 0; w < totalWeeks; w++) {
    var weekStart = new Date(minDate);
    weekStart.setDate(weekStart.getDate() + w * 7);
    html += '<div class="gantt-week-label">' + weekStart.toLocaleDateString('en-IN', {day:'numeric',month:'short'}) + '</div>';
  }
  html += '</div></div>';

  // Today line position
  var today = new Date();
  var todayPct = ((today - minDate) / (maxDate - minDate)) * 100;

  // Task bars
  tasks.forEach(function(t) {
    if (!t.startDate || !t.endDate) return;
    var start = new Date(t.startDate);
    var end = new Date(t.endDate);
    var leftPct = Math.max(0, ((start - minDate) / (maxDate - minDate)) * 100);
    var widthPct = Math.max(2, ((end - start) / (maxDate - minDate)) * 100);

    var barColor = t.status === 'completed' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--primary)' : 'var(--gray-300)';

    html += '<div class="gantt-task-row">';
    html += '<div class="gantt-name-col gantt-task-label wbs-level-' + t.level + '">' + escapeHTML(t.wbsCode) + ' ' + escapeHTML(t.taskName.substring(0, 25)) + '</div>';
    html += '<div class="gantt-weeks-col gantt-timeline" style="position:relative">';
    var barTitle = escapeHTML(t.wbsCode + ' ' + t.taskName) + ' | ' + (t.startDate||'?') + ' - ' + (t.endDate||'?') + ' | ' + Math.round(t.progressPct) + '%';
    html += '<div class="gantt-bar-planned" style="left:' + leftPct + '%;width:' + widthPct + '%" title="' + barTitle + '">';
    html += '<div class="gantt-bar-fill" style="width:' + t.progressPct + '%;background:' + barColor + '"></div>';
    if (t.progressPct > 0) html += '<span class="gantt-bar-pct">' + Math.round(t.progressPct) + '%</span>';
    html += '</div>';

    // Actual bar overlay
    if (t.actualStart) {
      var aStart = new Date(t.actualStart);
      var aEnd = t.actualEnd ? new Date(t.actualEnd) : today;
      var aLeft = Math.max(0, ((aStart - minDate) / (maxDate - minDate)) * 100);
      var aWidth = Math.max(1, ((aEnd - aStart) / (maxDate - minDate)) * 100);
      html += '<div style="position:absolute;top:14px;left:' + aLeft + '%;width:' + aWidth + '%;height:4px;background:var(--warning);border-radius:2px;opacity:0.7" title="Actual"></div>';
    }
    html += '</div></div>';
  });

  // Today line
  if (todayPct >= 0 && todayPct <= 100) {
    html += '<div class="gantt-task-row" style="height:0;position:relative">';
    html += '<div class="gantt-name-col"></div>';
    html += '<div class="gantt-weeks-col" style="position:relative">';
    html += '<div class="gantt-today-line" style="left:' + todayPct + '%"><span class="gantt-today-tip">Today</span></div>';
    html += '</div></div>';
  }

  // Legend
  html += '<div class="gantt-legend">';
  html += '<span><span style="display:inline-block;width:12px;height:8px;background:var(--gray-300);border-radius:2px;margin-right:4px"></span>Planned</span>';
  html += '<span><span style="display:inline-block;width:12px;height:8px;background:var(--primary);border-radius:2px;margin-right:4px"></span>In Progress</span>';
  html += '<span><span style="display:inline-block;width:12px;height:8px;background:var(--success);border-radius:2px;margin-right:4px"></span>Completed</span>';
  html += '<span><span style="display:inline-block;width:12px;height:4px;background:var(--warning);border-radius:2px;margin-right:4px"></span>Actual</span>';
  html += '</div>';

  html += '</div></div></div>';
  return html;
}

// =====================================================
// SITETRACK: DAILY LOG TAB
// =====================================================
function renderProjectDailyLogs(proj, isMDorHR) {
  var html = '<div style="padding:0 16px">';
  html += '<div style="margin-top:10px;margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="openDailyLogForm(' + proj.id + ')">+ Add Log Entry</button>' +
    '<button class="nf-btn nf-btn-secondary nf-btn-sm" onclick="uploadSitePhoto(' + proj.id + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Upload Site Photo</button></div>';
  html += '<div id="dailyLogFormArea"></div>';
  html += '<div id="dailyLogContent"><div class="nf-empty" style="margin-top:16px"><span class="spinner"></span> Loading logs...</div></div>';
  html += '</div>';
  setTimeout(function() { loadDailyLogs(proj.id); }, 50);
  return html;
}

function toggleDailyLogView(mode, projectId) {
  dailyLogViewMode = mode;
  loadDailyLogs(projectId);
}

async function loadDailyLogs(projectId) {
  var container = document.getElementById('dailyLogContent');
  if (!container) return;
  try {
    var logs = await apiCall('GET', '/sitetrack/projects/' + projectId + '/daily-logs');
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div class="nf-empty" style="margin-top:16px">No daily logs yet.</div>';
      return;
    }
    var mapped = logs.map(mapDailyWorkLog);
    var html = '';
    var weatherIcons = { Sunny:'☀️', Cloudy:'☁️', Rainy:'🌧️', Hot:'🔥', Clear:'🌤️' };

    // View toggle
    html += '<div class="log-view-toggle">';
    html += '<button class="' + (dailyLogViewMode==='card'?'active':'') + '" onclick="toggleDailyLogView(\'card\',' + projectId + ')">Cards</button>';
    html += '<button class="' + (dailyLogViewMode==='table'?'active':'') + '" onclick="toggleDailyLogView(\'table\',' + projectId + ')">Table</button>';
    html += '</div>';

    if (dailyLogViewMode === 'table') {
      html += '<div style="overflow-x:auto"><table class="daily-log-table">';
      html += '<thead><tr><th>Date</th><th class="col-weather">Weather</th><th class="col-workers">Workers</th><th>Description</th><th>Task</th><th>Progress</th><th>By</th></tr></thead>';
      html += '<tbody>';
      mapped.forEach(function(log) {
        var emp = EMPLOYEES.find(function(e){return e.code===log.loggedBy;});
        var empName = emp ? emp.name : log.loggedBy;
        var icon = weatherIcons[log.weather] || '';
        html += '<tr>';
        html += '<td style="white-space:nowrap;font-weight:600;color:var(--primary)">' + escapeHTML(log.logDate) + '</td>';
        html += '<td class="col-weather">' + icon + ' ' + escapeHTML(log.weather || '-') + '</td>';
        html += '<td class="col-workers">' + (log.workersCount || '-') + '</td>';
        html += '<td>' + escapeHTML(log.workDescription) + '</td>';
        html += '<td style="font-size:.68rem">' + (log.taskName ? escapeHTML(log.wbsCode + ' - ' + log.taskName) : '-') + '</td>';
        html += '<td>' + (log.progressUpdate ? log.progressUpdate + '%' : '-') + '</td>';
        html += '<td style="font-size:.68rem">' + escapeHTML(empName) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    } else {
      mapped.forEach(function(log) {
        var emp = EMPLOYEES.find(function(e){return e.code===log.loggedBy;});
        var empName = emp ? emp.name : log.loggedBy;
        var icon = weatherIcons[log.weather] || '';

        html += '<div class="log-entry">';
        html += '<div class="log-header">';
        html += '<span class="log-date">' + log.logDate + '</span>';
        if (log.weather) html += '<span style="margin-left:8px">' + icon + ' ' + escapeHTML(log.weather) + '</span>';
        if (log.workersCount) html += '<span style="margin-left:8px;font-size:.7rem;color:var(--gray-500)">Workers: ' + log.workersCount + '</span>';
        html += '</div>';
        html += '<div class="log-desc">' + escapeHTML(log.workDescription) + '</div>';
        if (log.taskName) html += '<div class="log-meta">Task: ' + escapeHTML(log.wbsCode + ' - ' + log.taskName) + '</div>';
        if (log.progressUpdate) html += '<div class="log-meta">Progress: ' + log.progressUpdate + '%</div>';
        if (log.materialsNote) html += '<div class="log-meta">Materials: ' + escapeHTML(log.materialsNote) + '</div>';
        if (log.remarks) html += '<div class="log-meta">Remarks: ' + escapeHTML(log.remarks) + '</div>';
        html += '<div class="log-by">by ' + escapeHTML(empName) + '</div>';
        html += '</div>';
      });
    }
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div class="nf-empty">Error loading daily logs</div>';
  }
}

function openDailyLogForm(projectId) {
  var area = document.getElementById('dailyLogFormArea');
  if (!area) return;
  var proj = projects.find(function(p){return p.id===projectId;});
  var taskOpts = '<option value="">No task link</option>';
  if (proj && proj.wbsTasks) {
    proj.wbsTasks.forEach(function(t) {
      taskOpts += '<option value="' + t.id + '">' + escapeHTML(t.wbsCode + ' - ' + t.taskName) + '</option>';
    });
  }
  var weatherOpts = WEATHER_OPTIONS.map(function(w) {
    return '<option value="' + w + '">' + w + '</option>';
  }).join('');

  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Add Daily Log</div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Date</label><input class="form-control" type="date" id="dlDate" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Weather</label><select class="form-control" id="dlWeather"><option value="">--</option>' + weatherOpts + '</select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Workers</label><input class="form-control" type="number" id="dlWorkers" min="0"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Work Description *</label><textarea class="form-control" id="dlDesc" rows="2"></textarea></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:2"><label class="form-label">Link to WBS Task</label><select class="form-control" id="dlTask">' + taskOpts + '</select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Progress %</label><input class="form-control" type="number" id="dlProgress" min="0" max="100"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Materials Note</label><input class="form-control" id="dlMaterials"></div>' +
    '<div class="form-group"><label class="form-label">Remarks</label><input class="form-control" id="dlRemarks"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveDailyLog(' + projectId + ')">Save</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="document.getElementById(\'dailyLogFormArea\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function saveDailyLog(projectId) {
  var desc = document.getElementById('dlDesc').value.trim();
  if (!desc) { showToast('Work description is required'); return; }
  var taskId = document.getElementById('dlTask').value || null;
  var progress = document.getElementById('dlProgress').value;
  try {
    await apiCall('POST', '/sitetrack/projects/' + projectId + '/daily-logs', {
      logDate: document.getElementById('dlDate').value,
      weather: document.getElementById('dlWeather').value,
      workersCount: parseInt(document.getElementById('dlWorkers').value, 10) || null,
      workDescription: desc,
      taskId: taskId ? parseInt(taskId, 10) : null,
      progressUpdate: progress ? parseFloat(progress) : null,
      materialsNote: document.getElementById('dlMaterials').value.trim(),
      remarks: document.getElementById('dlRemarks').value.trim()
    });
    // If task progress was updated, refresh WBS data
    if (taskId && progress) {
      var proj = projects.find(function(p){return p.id===projectId;});
      if (proj) {
        try {
          var wbsData = await apiCall('GET', '/sitetrack/projects/' + projectId + '/wbs');
          proj.wbsTasks = wbsData.map(mapWBSTask);
        } catch (e2) { /* ok */ }
      }
    }
    showToast('Daily log saved');
    document.getElementById('dailyLogFormArea').innerHTML = '';
    loadDailyLogs(projectId);
  } catch (e) { showToast('Error saving log'); }
}

function openTaskForm(projectId) {
  var area = document.getElementById('projectTaskFormArea');
  if (!area) return;
  var empOpts = '<option value="">Unassigned</option>';
  EMPLOYEES.forEach(function(e) {
    if (e.status === 'Inactive') return;
    empOpts += '<option value="' + e.code + '">' + escapeHTML(e.name) + ' (' + e.code + ')</option>';
  });
  var prioOpts = TASK_PRIORITIES.map(function(p) {
    return '<option value="' + p + '"' + (p==='Medium'?' selected':'') + '>' + p + '</option>';
  }).join('');

  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div class="nf-section-title" style="margin-bottom:8px">Add Task</div>' +
    '<div class="form-group"><label class="form-label">Title *</label><input class="form-control" id="projTaskTitle"></div>' +
    '<div class="form-group"><label class="form-label">Description</label><input class="form-control" id="projTaskDesc"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<div class="form-group" style="flex:1"><label class="form-label">Priority</label><select class="form-control" id="projTaskPriority">' + prioOpts + '</select></div>' +
    '<div class="form-group" style="flex:1"><label class="form-label">Due Date</label><input class="form-control" type="date" id="projTaskDue"></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Assign To</label><select class="form-control" id="projTaskAssign">' + empOpts + '</select></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="nf-btn nf-btn-primary" onclick="saveProjectTask(' + projectId + ')">Add</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="document.getElementById(\'projectTaskFormArea\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function saveProjectTask(projectId) {
  var title = document.getElementById('projTaskTitle').value.trim();
  if (!title) { showToast('Task title is required'); return; }
  var taskData = {
    title: title,
    description: document.getElementById('projTaskDesc').value.trim(),
    priority: document.getElementById('projTaskPriority').value,
    assignedTo: document.getElementById('projTaskAssign').value,
    status: 'Pending',
    dueDate: document.getElementById('projTaskDue').value
  };
  try {
    await apiCall('POST', '/projects/' + projectId + '/tasks', taskData);
    showToast('Task added');
    await refreshProject(projectId);
  } catch (e) { showToast('Error adding task'); }
}

async function toggleProjectTaskStatus(projectId, taskId) {
  var proj = projects.find(function(p){return p.id===projectId;});
  if (!proj) return;
  var task = proj.tasks.find(function(t){return t.id===taskId;});
  if (!task) return;
  var newStatus;
  if (task.status === 'Pending') newStatus = 'In Progress';
  else if (task.status === 'In Progress') newStatus = 'Done';
  else newStatus = 'Pending';
  try {
    await apiCall('PUT', '/projects/' + projectId + '/tasks/' + taskId, { status: newStatus });
    await refreshProject(projectId);
  } catch(e) { showToast('Error updating task'); }
}

function openAddMemberUI(projectId) {
  var proj = projects.find(function(p){return p.id===projectId;});
  if (!proj) return;
  var area = document.getElementById('projectMemberFormArea');
  if (!area) return;

  var empOpts = '<option value="">Select employee...</option>';
  EMPLOYEES.forEach(function(e) {
    if (e.status === 'Inactive') return;
    if (proj.team.indexOf(e.code) !== -1) return;
    empOpts += '<option value="' + e.code + '">' + escapeHTML(e.name) + ' (' + e.code + ' - ' + escapeHTML(e.dept||'') + ')</option>';
  });

  area.innerHTML = '<div class="card" style="padding:12px;border-left:4px solid var(--primary);margin-bottom:8px">' +
    '<div style="display:flex;gap:8px;align-items:flex-end">' +
    '<div class="form-group" style="flex:1;margin-bottom:0"><label class="form-label">Employee</label><select class="form-control" id="projAddMember">' + empOpts + '</select></div>' +
    '<button class="nf-btn nf-btn-primary" onclick="addProjectMember(' + projectId + ')">Add</button>' +
    '<button class="nf-btn nf-btn-secondary" onclick="document.getElementById(\'projectMemberFormArea\').innerHTML=\'\'">Cancel</button>' +
    '</div></div>';
}

async function addProjectMember(projectId) {
  var code = document.getElementById('projAddMember').value;
  if (!code) { showToast('Select an employee'); return; }
  try {
    await apiCall('POST', '/projects/' + projectId + '/team', { empCode: code });
    showToast('Member added');
    await refreshProject(projectId);
  } catch(e) { showToast('Error adding member'); }
}

async function removeProjectMember(projectId, empCode) {
  if (!confirm('Remove this member from the project?')) return;
  try {
    await apiCall('DELETE', '/projects/' + projectId + '/team/' + empCode);
    showToast('Member removed');
    await refreshProject(projectId);
  } catch(e) { showToast('Error removing member'); }
}

function editProject(id) {
  hideOverlay('project-detail');
  setTimeout(function() { openProjectForm(id); }, 200);
}

// =====================================================
// =====================================================
// ACCOUNTS DEPARTMENT — PAYMENTS & SETTLEMENTS
// =====================================================
function renderAccountsPayments() {
  var c = document.getElementById('accPaymentsContent');
  if (!c) return;
  var titleEl = document.getElementById('accPaymentsTitle');

  var section = 'approved-advances';
  if (_activeNavId === 'emp-acc-approved-exp' || _activeNavId === 'acc-approved-exp') section = 'approved-expenses';
  if (_activeNavId === 'emp-acc-settlement' || _activeNavId === 'acc-settlement') section = 'settlement';

  if (titleEl) {
    var titles = {'approved-advances':'Approved Advances','approved-expenses':'Approved Expenses','settlement':'Settlement Tracker'};
    titleEl.textContent = titles[section] || 'Payments';
  }

  if (section === 'approved-advances') renderAccApprovedAdvances(c);
  else if (section === 'approved-expenses') renderAccApprovedExpenses(c);
  else if (section === 'settlement') renderAccSettlementTracker(c);
}

function renderAccApprovedAdvances(c) {
  var all = (typeof advanceRequests !== 'undefined' ? advanceRequests : []).filter(function(r) {
    var s = (r.status || '').toLowerCase();
    return s === 'approved' || s === 'paid';
  });
  var pending = all.filter(function(r) { return (r.status || '').toLowerCase() === 'approved'; });
  var paid    = all.filter(function(r) { return (r.status || '').toLowerCase() === 'paid'; });

  var ADV_TYPE = { site:'Site', salary:'Salary', travel:'Travel', site_expense:'Site Expense', travel_expense:'Travel Expense' };

  function advRow(r, isPaid) {
    var typeLabel = ADV_TYPE[r.type] || r.type || '';
    var row = '<div style="padding:12px 0;border-bottom:1px solid var(--gray-100)">';
    row += '<div style="display:flex;align-items:flex-start;gap:10px">';
    row += '<div style="flex:1">';
    row += '<div style="font-weight:600;font-size:.83rem">' + escapeHTML(r.empName || r.empCode) + '<span style="font-size:.68rem;color:var(--gray-400);font-weight:400;margin-left:6px">' + escapeHTML(r.empCode) + ' &bull; ' + escapeHTML(r.dept || '') + '</span></div>';
    row += '<div style="font-size:.73rem;color:var(--gray-500);margin-top:2px">' + escapeHTML(typeLabel) + ' Advance &bull; Applied: ' + escapeHTML(r.appliedDate || '') + '</div>';
    if (r.reason)  row += '<div style="font-size:.7rem;color:var(--gray-600);margin-top:2px">Reason: ' + escapeHTML(r.reason) + '</div>';
    if (r.details) row += '<div style="font-size:.7rem;color:var(--gray-500);margin-top:1px">Details: ' + escapeHTML(r.details) + '</div>';
    if (r.reviewedBy) row += '<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">Approved by: ' + escapeHTML(r.reviewedBy) + (r.reviewDate ? ' on ' + escapeHTML(r.reviewDate) : '') + '</div>';
    if (isPaid && r.paidBy)  row += '<div style="font-size:.68rem;color:#16a34a;margin-top:2px;font-weight:600">Paid by: ' + escapeHTML(r.paidBy) + (r.paidDate ? ' on ' + escapeHTML(r.paidDate) : '') + '</div>';
    row += '</div>';
    row += '<div style="text-align:right;min-width:100px">';
    row += '<div style="font-weight:700;font-size:.9rem;color:var(--primary)">Rs.' + (r.amount || 0).toLocaleString('en-IN') + '</div>';
    if (isPaid) {
      row += '<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:.65rem;font-weight:700;background:#dcfce7;color:#16a34a;border-radius:4px">PAID</span>';
    } else {
      row += '<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:.65rem;font-weight:700;background:#fef9c3;color:#b45309;border-radius:4px">APPROVED</span>';
      row += '<div style="margin-top:6px"><button onclick="markAdvancePaid(' + r.id + ');renderAccountsPayments();" style="padding:5px 12px;font-size:.7rem;font-weight:600;background:#10B981;color:#fff;border:none;border-radius:6px;cursor:pointer">Mark Paid</button></div>';
    }
    row += '</div></div></div>';
    return row;
  }

  var html = '';
  // Pending payment section
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--gray-600);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Pending Payment (' + pending.length + ')</div>';
  if (pending.length === 0) {
    html += '<div class="card" style="padding:16px;text-align:center;color:var(--gray-400);font-size:.78rem;margin-bottom:16px">No advances pending payment</div>';
  } else {
    var pendingTotal = pending.reduce(function(s, r) { return s + (r.amount || 0); }, 0);
    html += '<div class="card" style="padding:0 12px;margin-bottom:16px">';
    pending.sort(function(a, b) { return b.id - a.id; }).forEach(function(r) { html += advRow(r, false); });
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:.82rem;border-top:2px solid var(--gray-200)"><span>Total to Disburse</span><span style="color:var(--primary)">Rs.' + pendingTotal.toLocaleString('en-IN') + '</span></div>';
    html += '</div>';
  }
  // Paid history section
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--gray-600);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Paid History (' + paid.length + ')</div>';
  if (paid.length === 0) {
    html += '<div class="card" style="padding:16px;text-align:center;color:var(--gray-400);font-size:.78rem">No paid advances yet</div>';
  } else {
    var paidTotal = paid.reduce(function(s, r) { return s + (r.amount || 0); }, 0);
    html += '<div class="card" style="padding:0 12px">';
    paid.sort(function(a, b) { return b.id - a.id; }).forEach(function(r) { html += advRow(r, true); });
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:.82rem;border-top:2px solid var(--gray-200)"><span>Total Disbursed</span><span style="color:#16a34a">Rs.' + paidTotal.toLocaleString('en-IN') + '</span></div>';
    html += '</div>';
  }
  c.innerHTML = html;
}

function renderAccApprovedExpenses(c) {
  var all = (typeof expenseReimbursements !== 'undefined' ? expenseReimbursements : []).filter(function(e) {
    return e.status === 'Approved' || e.status === 'Paid';
  });
  var pending = all.filter(function(e) { return e.status === 'Approved'; });
  var paid    = all.filter(function(e) { return e.status === 'Paid'; });

  function expRow(e, isPaid) {
    var row = '<div style="padding:12px 0;border-bottom:1px solid var(--gray-100)">';
    row += '<div style="display:flex;align-items:flex-start;gap:10px">';
    row += '<div style="flex:1">';
    row += '<div style="font-weight:600;font-size:.83rem">' + escapeHTML(e.empName || e.empCode) + '<span style="font-size:.68rem;color:var(--gray-400);font-weight:400;margin-left:6px">' + escapeHTML(e.empCode) + '</span></div>';
    var meta = [e.category, e.expenseType, e.date].filter(Boolean).map(escapeHTML).join(' &bull; ');
    if (meta) row += '<div style="font-size:.73rem;color:var(--gray-500);margin-top:2px">' + meta + '</div>';
    if (e.description) row += '<div style="font-size:.7rem;color:var(--gray-600);margin-top:2px">Desc: ' + escapeHTML(e.description) + '</div>';
    if (e.project)    row += '<div style="font-size:.7rem;color:var(--gray-500);margin-top:1px">Project: ' + escapeHTML(e.project) + '</div>';
    if (e.travelFrom && e.travelTo) row += '<div style="font-size:.7rem;color:var(--gray-500);margin-top:1px">Route: ' + escapeHTML(e.travelFrom) + ' → ' + escapeHTML(e.travelTo) + (e.travelKm ? ' (' + e.travelKm + ' km)' : '') + '</div>';
    if (e.billUrl)    row += ' <a href="' + escapeHTML(e.billUrl) + '" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600">📎 View Bill</a>';
    if (e.reviewedBy) row += '<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">Approved by: ' + escapeHTML(e.reviewedBy) + (e.reviewDate ? ' on ' + escapeHTML(e.reviewDate) : '') + '</div>';
    if (isPaid && e.paidBy) row += '<div style="font-size:.68rem;color:#16a34a;margin-top:2px;font-weight:600">Reimbursed by: ' + escapeHTML(e.paidBy) + (e.paidDate ? ' on ' + escapeHTML(e.paidDate) : '') + '</div>';
    row += '</div>';
    row += '<div style="text-align:right;min-width:100px">';
    row += '<div style="font-weight:700;font-size:.9rem;color:var(--primary)">Rs.' + (e.amount || 0).toLocaleString('en-IN') + '</div>';
    if (isPaid) {
      row += '<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:.65rem;font-weight:700;background:#dcfce7;color:#16a34a;border-radius:4px">REIMBURSED</span>';
    } else {
      row += '<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:.65rem;font-weight:700;background:#fef9c3;color:#b45309;border-radius:4px">APPROVED</span>';
      row += '<div style="margin-top:6px"><button onclick="markExpensePaid(' + e.id + ');renderAccountsPayments();" style="padding:5px 12px;font-size:.7rem;font-weight:600;background:#10B981;color:#fff;border:none;border-radius:6px;cursor:pointer">Mark Reimbursed</button></div>';
    }
    row += '</div></div></div>';
    return row;
  }

  var html = '';
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--gray-600);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Pending Reimbursement (' + pending.length + ')</div>';
  if (pending.length === 0) {
    html += '<div class="card" style="padding:16px;text-align:center;color:var(--gray-400);font-size:.78rem;margin-bottom:16px">No expenses pending reimbursement</div>';
  } else {
    var pendingTotal = pending.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    html += '<div class="card" style="padding:0 12px;margin-bottom:16px">';
    pending.sort(function(a, b) { return b.id - a.id; }).forEach(function(e) { html += expRow(e, false); });
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:.82rem;border-top:2px solid var(--gray-200)"><span>Total to Reimburse</span><span style="color:var(--primary)">Rs.' + pendingTotal.toLocaleString('en-IN') + '</span></div>';
    html += '</div>';
  }
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--gray-600);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Reimbursed History (' + paid.length + ')</div>';
  if (paid.length === 0) {
    html += '<div class="card" style="padding:16px;text-align:center;color:var(--gray-400);font-size:.78rem">No reimbursed expenses yet</div>';
  } else {
    var paidTotal = paid.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    html += '<div class="card" style="padding:0 12px">';
    paid.sort(function(a, b) { return b.id - a.id; }).forEach(function(e) { html += expRow(e, true); });
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:.82rem;border-top:2px solid var(--gray-200)"><span>Total Reimbursed</span><span style="color:#16a34a">Rs.' + paidTotal.toLocaleString('en-IN') + '</span></div>';
    html += '</div>';
  }
  c.innerHTML = html;
}

function renderAccSettlementTracker(c) {
  // Per-employee: advances given (approved+paid) vs expenses claimed (approved+paid)
  var empMap = {};
  function ensureEmp(code, name) {
    if (!empMap[code]) empMap[code] = { name: name || code, advApproved: 0, advPaid: 0, expApproved: 0, expPaid: 0 };
  }
  (typeof advanceRequests !== 'undefined' ? advanceRequests : []).forEach(function(r) {
    var s = (r.status || '').toLowerCase();
    if (s !== 'approved' && s !== 'paid') return;
    ensureEmp(r.empCode, r.empName);
    if (s === 'approved') empMap[r.empCode].advApproved += (r.amount || 0);
    else                  empMap[r.empCode].advPaid    += (r.amount || 0);
  });
  (typeof expenseReimbursements !== 'undefined' ? expenseReimbursements : []).forEach(function(e) {
    if (e.status !== 'Approved' && e.status !== 'Paid') return;
    ensureEmp(e.empCode, e.empName);
    if (e.status === 'Approved') empMap[e.empCode].expApproved += (e.amount || 0);
    else                         empMap[e.empCode].expPaid     += (e.amount || 0);
  });
  var employees = Object.keys(empMap).sort();
  var html = '';
  if (employees.length === 0) {
    html += '<div class="card" style="padding:20px;text-align:center;color:var(--gray-400)">No settlements to track</div>';
  } else {
    var th = function(t, align) { return '<th style="padding:8px 10px;text-align:' + (align||'left') + ';font-size:.7rem;font-weight:700;color:var(--gray-500);border-bottom:2px solid var(--gray-200);white-space:nowrap">' + t + '</th>'; };
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
    html += '<thead><tr style="background:var(--gray-50)">' + th('Employee') + th('Adv Approved','right') + th('Adv Paid','right') + th('Exp Approved','right') + th('Exp Reimbursed','right') + th('Net Balance','right') + '</tr></thead><tbody>';
    var gAA=0, gAP=0, gEA=0, gEP=0;
    employees.forEach(function(code) {
      var e = empMap[code];
      var totalAdv = e.advApproved + e.advPaid;
      var totalExp = e.expApproved + e.expPaid;
      var balance  = totalAdv - totalExp;
      gAA += e.advApproved; gAP += e.advPaid; gEA += e.expApproved; gEP += e.expPaid;
      var balColor = balance > 0 ? '#dc2626' : balance < 0 ? '#16a34a' : '#6b7280';
      var balLabel = balance > 0 ? '▲ To Return' : balance < 0 ? '▼ To Reimburse' : '✓ Settled';
      var td = function(v, color, extra) { return '<td style="padding:8px 10px;text-align:right;font-size:.76rem;border-bottom:1px solid var(--gray-100);' + (color ? 'color:'+color+';font-weight:700;' : '') + (extra||'') + '">Rs.' + Math.abs(v).toLocaleString('en-IN') + '</td>'; };
      html += '<tr>';
      var safeCode = code.replace(/'/g, "\\'");
      var safeName = (e.name || '').replace(/'/g, "\\'");
      html += '<td style="padding:8px 10px;font-size:.78rem;border-bottom:1px solid var(--gray-100)"><button onclick="showEmpPaymentHistory(\'' + safeCode + '\',\'' + safeName + '\')" style="background:none;border:none;cursor:pointer;text-align:left;padding:0"><span style="font-weight:700;color:var(--primary);font-size:.78rem">' + escapeHTML(e.name) + '</span><br><span style="font-size:.65rem;color:var(--gray-400);font-weight:400">' + escapeHTML(code) + '</span></button></td>';
      html += td(e.advApproved, e.advApproved ? '#b45309' : null);
      html += td(e.advPaid, e.advPaid ? '#16a34a' : null);
      html += td(e.expApproved, e.expApproved ? '#b45309' : null);
      html += td(e.expPaid, e.expPaid ? '#16a34a' : null);
      html += '<td style="padding:8px 10px;text-align:right;font-size:.76rem;font-weight:700;color:' + balColor + ';border-bottom:1px solid var(--gray-100)">Rs.' + Math.abs(balance).toLocaleString('en-IN') + '<br><span style="font-size:.6rem;font-weight:600">' + balLabel + '</span></td>';
      html += '</tr>';
    });
    var grandBal = (gAA+gAP) - (gEA+gEP);
    html += '</tbody><tfoot><tr style="background:var(--gray-50);font-weight:700">';
    html += '<td style="padding:10px;font-size:.78rem">Grand Total</td>';
    var tdf = function(v) { return '<td style="padding:10px;text-align:right;font-size:.78rem;font-weight:700">Rs.' + v.toLocaleString('en-IN') + '</td>'; };
    html += tdf(gAA) + tdf(gAP) + tdf(gEA) + tdf(gEP);
    html += '<td style="padding:10px;text-align:right;font-size:.78rem;font-weight:700;color:' + (grandBal > 0 ? '#dc2626' : grandBal < 0 ? '#16a34a' : '#6b7280') + '">Rs.' + Math.abs(grandBal).toLocaleString('en-IN') + '</td>';
    html += '</tr></tfoot></table></div>';
    // Legend
    html += '<div style="margin-top:12px;font-size:.68rem;color:var(--gray-400);display:flex;gap:16px;flex-wrap:wrap">';
    html += '<span style="color:#b45309;font-weight:600">■ Approved</span> = pending disbursal/reimbursement';
    html += '<span style="color:#16a34a;font-weight:600;margin-left:8px">■ Paid</span> = already disbursed/reimbursed';
    html += '</div>';
  }
  c.innerHTML = html;
}

// =====================================================
// EMPLOYEE PAYMENT HISTORY MODAL (Settlement Tracker drill-down)
// =====================================================
function showEmpPaymentHistory(empCode, empName) {
  var advances = (typeof advanceRequests !== 'undefined' ? advanceRequests : [])
    .filter(function(r) { return r.empCode === empCode; })
    .sort(function(a, b) { return b.id - a.id; });
  var expenses = (typeof expenseReimbursements !== 'undefined' ? expenseReimbursements : [])
    .filter(function(e) { return e.empCode === empCode; })
    .sort(function(a, b) { return b.id - a.id; });

  var STATUS_STYLE = {
    pending:           { bg:'#FEF3C7', color:'#92400E', label:'Pending' },
    accounts_accepted: { bg:'#DBEAFE', color:'#1D4ED8', label:'Accts Accepted' },
    hr_accepted:       { bg:'#FEF3C7', color:'#92400E', label:'HR Accepted' },
    approved:          { bg:'#D1FAE5', color:'#065F46', label:'MD Approved' },
    paid:              { bg:'#EDE9FE', color:'#5B21B6', label:'Paid' },
    rejected:          { bg:'#FEE2E2', color:'#991B1B', label:'Rejected' }
  };

  function statusBadge(rawStatus) {
    var s = (rawStatus || '').toLowerCase();
    var st = STATUS_STYLE[s] || { bg:'var(--gray-100)', color:'var(--gray-500)', label: rawStatus || 'Unknown' };
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.6rem;font-weight:700;background:' + st.bg + ';color:' + st.color + '">' + st.label + '</span>';
  }

  function advCard(r) {
    var typeLabel = ADV_TYPE_LABELS[r.type] || r.type || 'Advance';
    var s = (r.status || '').toLowerCase();
    var borderColor = s === 'paid' ? '#8b5cf6' : s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : s === 'accounts_accepted' ? '#3b82f6' : '#f59e0b';
    var html = '<div style="border-left:3px solid ' + borderColor + ';padding:10px 12px;background:var(--gray-50);border-radius:0 8px 8px 0;margin-bottom:8px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
    html += '<div style="flex:1">';
    html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">';
    html += '<span style="font-size:.72rem;font-weight:700;color:var(--gray-700)">' + escapeHTML(typeLabel) + '</span>';
    html += statusBadge(r.status);
    if (r.urgency && r.urgency !== 'normal') html += '<span style="font-size:.6rem;background:#FEE2E2;color:#991B1B;padding:1px 6px;border-radius:8px;font-weight:700">' + escapeHTML(r.urgency) + '</span>';
    html += '</div>';
    if (r.reason)   html += '<div style="font-size:.71rem;color:var(--gray-600);margin-bottom:2px">' + escapeHTML(r.reason) + '</div>';
    if (r.details)  html += '<div style="font-size:.7rem;color:var(--gray-500);margin-bottom:2px">' + escapeHTML(r.details) + '</div>';
    if (r.project)  html += '<div style="font-size:.68rem;color:var(--gray-400)">Project: ' + escapeHTML(r.project) + '</div>';
    html += '<div style="font-size:.67rem;color:var(--gray-400);margin-top:4px">Applied: ' + escapeHTML(r.appliedDate || '') + '</div>';
    if (r.reviewedBy) html += '<div style="font-size:.67rem;color:var(--gray-400)">Reviewed by ' + escapeHTML(r.reviewedBy) + (r.reviewDate ? ' on ' + escapeHTML(r.reviewDate) : '') + '</div>';
    if (r.rejectReason) html += '<div style="font-size:.68rem;color:#dc2626;margin-top:2px;font-weight:600">Rejected: ' + escapeHTML(r.rejectReason) + '</div>';
    if (r.paidBy)   html += '<div style="font-size:.67rem;color:#16a34a;font-weight:600">Paid by ' + escapeHTML(r.paidBy) + (r.paidDate ? ' on ' + escapeHTML(r.paidDate) : '') + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;flex-shrink:0"><div style="font-size:.88rem;font-weight:800;color:var(--gray-800)">\u20B9' + (r.amount || 0).toLocaleString('en-IN') + '</div></div>';
    html += '</div></div>';
    return html;
  }

  function expCard(e) {
    var s = (e.status || '').toLowerCase();
    var borderColor = s === 'paid' ? '#8b5cf6' : s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : s === 'accounts_accepted' ? '#3b82f6' : '#f59e0b';
    var typeLabel = e.expenseType ? (ADV_TYPE_LABELS[e.expenseType] || e.expenseType) : (e.category || 'Expense');
    var html = '<div style="border-left:3px solid ' + borderColor + ';padding:10px 12px;background:var(--gray-50);border-radius:0 8px 8px 0;margin-bottom:8px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
    html += '<div style="flex:1">';
    html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">';
    html += '<span style="font-size:.72rem;font-weight:700;color:var(--gray-700)">' + escapeHTML(typeLabel) + '</span>';
    html += statusBadge(e.status);
    html += '</div>';
    if (e.description)  html += '<div style="font-size:.71rem;color:var(--gray-600);margin-bottom:2px">' + escapeHTML(e.description) + '</div>';
    if (e.project)      html += '<div style="font-size:.68rem;color:var(--gray-400)">Project: ' + escapeHTML(e.project) + '</div>';
    if (e.travelFrom && e.travelTo) html += '<div style="font-size:.68rem;color:var(--gray-400)">Route: ' + escapeHTML(e.travelFrom) + ' → ' + escapeHTML(e.travelTo) + (e.travelKm ? ' (' + e.travelKm + ' km)' : '') + '</div>';
    if (e.billUrl)      html += '<a href="' + escapeHTML(e.billUrl) + '" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600">📎 View Bill</a>';
    html += '<div style="font-size:.67rem;color:var(--gray-400);margin-top:4px">Date: ' + escapeHTML(e.date || e.submittedOn || '') + '</div>';
    if (e.reviewedBy)   html += '<div style="font-size:.67rem;color:var(--gray-400)">Reviewed by ' + escapeHTML(e.reviewedBy) + (e.reviewDate ? ' on ' + escapeHTML(e.reviewDate) : '') + '</div>';
    if (e.paidBy)       html += '<div style="font-size:.67rem;color:#16a34a;font-weight:600">Reimbursed by ' + escapeHTML(e.paidBy) + (e.paidDate ? ' on ' + escapeHTML(e.paidDate) : '') + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;flex-shrink:0"><div style="font-size:.88rem;font-weight:800;color:var(--gray-800)">\u20B9' + (e.amount || 0).toLocaleString('en-IN') + '</div></div>';
    html += '</div></div>';
    return html;
  }

  // Summary numbers
  var advTotal = advances.filter(function(r){ var s=(r.status||'').toLowerCase(); return s==='approved'||s==='paid'; }).reduce(function(s,r){return s+(r.amount||0);},0);
  var expTotal = expenses.filter(function(e){ return e.status==='Approved'||e.status==='Paid'; }).reduce(function(s,e){return s+(e.amount||0);},0);
  var netBalance = advTotal - expTotal;
  var netColor = netBalance > 0 ? '#dc2626' : netBalance < 0 ? '#16a34a' : '#6b7280';
  var netLabel = netBalance > 0 ? 'Employee owes return' : netBalance < 0 ? 'Company owes reimbursement' : 'Settled';

  var modalHtml = '<div class="nf-modal-overlay" id="empHistoryModal" onclick="if(event.target===this)this.remove()" style="align-items:flex-start;padding:16px">';
  modalHtml += '<div class="nf-modal" style="max-width:560px;width:100%;max-height:90vh;padding:0;overflow:hidden;display:flex;flex-direction:column">';

  // Header
  modalHtml += '<div style="padding:16px 18px;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">';
  modalHtml += '<div><div style="font-size:.95rem;font-weight:700;color:var(--gray-800)">' + escapeHTML(empName) + '</div>';
  modalHtml += '<div style="font-size:.7rem;color:var(--gray-400);margin-top:1px">' + escapeHTML(empCode) + ' — Complete Payment History</div></div>';
  modalHtml += '<button onclick="document.getElementById(\'empHistoryModal\').remove()" style="background:none;border:none;cursor:pointer;color:var(--gray-400);padding:4px;border-radius:6px;display:flex"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  modalHtml += '</div>';

  // Summary bar
  modalHtml += '<div style="display:flex;gap:0;border-bottom:1px solid var(--gray-100);flex-shrink:0">';
  modalHtml += '<div style="flex:1;padding:10px 14px;border-right:1px solid var(--gray-100)"><div style="font-size:.65rem;color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Total Advanced</div><div style="font-size:.9rem;font-weight:800;color:#b45309;margin-top:2px">\u20B9' + advTotal.toLocaleString('en-IN') + '</div></div>';
  modalHtml += '<div style="flex:1;padding:10px 14px;border-right:1px solid var(--gray-100)"><div style="font-size:.65rem;color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Total Expenses</div><div style="font-size:.9rem;font-weight:800;color:#7c3aed;margin-top:2px">\u20B9' + expTotal.toLocaleString('en-IN') + '</div></div>';
  modalHtml += '<div style="flex:1;padding:10px 14px"><div style="font-size:.65rem;color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Net Balance</div><div style="font-size:.9rem;font-weight:800;color:' + netColor + ';margin-top:2px">\u20B9' + Math.abs(netBalance).toLocaleString('en-IN') + '</div><div style="font-size:.6rem;color:' + netColor + ';font-weight:600">' + netLabel + '</div></div>';
  modalHtml += '</div>';

  // Scrollable content
  modalHtml += '<div style="overflow-y:auto;padding:14px 16px;flex:1">';

  // Advances section
  modalHtml += '<div style="font-size:.72rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Advances (' + advances.length + ')</div>';
  if (advances.length === 0) {
    modalHtml += '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.75rem;background:var(--gray-50);border-radius:8px;margin-bottom:14px">No advance requests</div>';
  } else {
    advances.forEach(function(r) { modalHtml += advCard(r); });
  }

  // Expenses section
  modalHtml += '<div style="font-size:.72rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">Expenses (' + expenses.length + ')</div>';
  if (expenses.length === 0) {
    modalHtml += '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.75rem;background:var(--gray-50);border-radius:8px">No expense claims</div>';
  } else {
    expenses.forEach(function(e) { modalHtml += expCard(e); });
  }

  modalHtml += '</div></div></div>';

  // Remove existing modal if open, then inject
  var existing = document.getElementById('empHistoryModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// =====================================================
// CHANGE 1: EMPLOYEE ATTENDANCE VIEW (HR sees all)
// =====================================================
var _attendanceOriginalHTML = '';
function renderAttendanceView() {
  if (!currentUser) return;
  var container = document.getElementById('screen-attendance');
  if (!container) return;
  // Save original HTML on first call so we can restore it
  if (!_attendanceOriginalHTML && container.querySelector('#calDays')) {
    _attendanceOriginalHTML = container.innerHTML;
  }
  var isHR = currentUser.role === 'HR';
  var isMD = currentUser.role === 'MD';
  // HR "Employee Attendance" mode — show employee selector + their calendar
  if ((isHR && _activeNavId === 'hr-att-emp') || (isMD && _activeNavId === 'md-att-report')) {
    renderEmployeeAttendanceView();
    return;
  }
  // Default: self calendar — restore original HTML if it was replaced
  if (_attendanceOriginalHTML && !container.querySelector('#calDays')) {
    container.innerHTML = _attendanceOriginalHTML;
  }
  buildCalendar();
}

var _hrAttSelectedEmp = null;
function renderEmployeeAttendanceView() {
  var container = document.getElementById('screen-attendance');
  if (!container) return;
  var deptFilter = '<select id="attDeptFilter" onchange="filterAttEmpList()" style="padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem;margin-right:8px"><option value="">All Depts</option>';
  var depts = [];
  EMPLOYEES.forEach(function(e) { if (depts.indexOf(e.dept) === -1) depts.push(e.dept); });
  depts.forEach(function(d) { deptFilter += '<option value="' + escapeAttr(d) + '">' + escapeHTML(d) + '</option>'; });
  deptFilter += '</select>';
  var html = '<div class="section-title" style="margin-top:4px">Employee Attendance</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">' + deptFilter;
  html += '<input type="text" id="attEmpSearch" oninput="filterAttEmpList()" placeholder="Search employee..." style="flex:1;min-width:120px;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem">';
  html += '</div>';
  html += '<div id="attEmpListArea" class="card fade-in" style="max-height:260px;overflow-y:auto"></div>';
  html += '<div id="attEmpCalendarArea" style="margin-top:12px"></div>';
  // Public Holidays manager (HR/MD only)
  html += '<div id="publicHolidaysArea" style="margin-top:16px"></div>';
  // Daily attendance summary table
  html += '<div style="margin-top:16px">';
  html += '<div class="section-title">Daily Attendance Summary</div>';
  html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">';
  html += '<input type="date" id="attSummaryDate" value="' + new Date().toISOString().split('T')[0] + '" onchange="loadAttendanceSummaryTable()" style="padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem">';
  html += '</div>';
  html += '<div id="attSummaryTableArea" class="card fade-in"></div>';
  html += '</div>';
  // Add HR missed attendance requests section
  if (currentUser && currentUser.role === 'HR') {
    html += renderMissedAttForHR();
  }
  container.innerHTML = html;
  filterAttEmpList();
  loadAttendanceSummaryTable();
  // Load + render public holidays panel for HR/MD
  loadPublicHolidays().then(renderPublicHolidaysPanel);
}

async function loadAttendanceSummaryTable() {
  var area = document.getElementById('attSummaryTableArea');
  if (!area) return;
  var dateInput = document.getElementById('attSummaryDate');
  var selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  var monthStr = selectedDate.substring(0, 7);
  var dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric', weekday:'long'});

  area.innerHTML = '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.78rem">Loading...</div>';

  var logs = [];
  try {
    logs = await apiCall('GET', '/attendance?month=' + monthStr);
    if (!Array.isArray(logs)) logs = [];
  } catch(e) { logs = []; }

  // Filter logs for the selected date — collect ALL sessions per employee
  var dayLogs = {};
  var dayAllLogs = {};
  logs.forEach(function(row) {
    if (!row.log_date) return;
    var logDate = row.log_date.substring(0, 10);
    if (logDate === selectedDate) {
      if (!dayLogs[row.emp_code]) dayLogs[row.emp_code] = row;
      if (!dayAllLogs[row.emp_code]) dayAllLogs[row.emp_code] = [];
      dayAllLogs[row.emp_code].push(row);
    }
  });

  // Build table rows for all active employees sorted by code ascending
  var activeEmps = EMPLOYEES.filter(function(e) { return e.status !== 'Inactive'; });
  activeEmps.sort(function(a, b) { return a.code.localeCompare(b.code); });

  var presentCount = 0, absentCount = 0;
  var rows = activeEmps.map(function(emp) {
    var log = dayLogs[emp.code];
    var isPresent = !!log;
    if (isPresent) presentCount++; else absentCount++;
    var statusBadge = isPresent
      ? '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:.72rem;font-weight:600;background:#dcfce7;color:#16a34a">Present</span>'
      : '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:.72rem;font-weight:600;background:#fee2e2;color:#dc2626">Absent</span>';
    // Calculate hours worked from all sessions
    var hoursHtml = '<span style="color:var(--gray-300);font-size:.68rem">—</span>';
    var inTimeHtml = '<span style="color:var(--gray-300);font-size:.68rem">—</span>';
    var outTimeHtml = '<span style="color:var(--gray-300);font-size:.68rem">—</span>';
    if (isPresent) {
      var sessions = dayAllLogs[emp.code] || [];
      var totalMin = 0;
      var firstIn = null, lastOut = null;
      sessions.forEach(function(s) {
        if (s.check_in) {
          if (!firstIn) firstIn = s.check_in;
          var start = new Date(s.check_in).getTime();
          var end = s.check_out ? new Date(s.check_out).getTime() : Date.now();
          if (end > start) totalMin += (end - start) / 60000;
        }
        if (s.check_out) lastOut = s.check_out;
      });
      if (firstIn) inTimeHtml = '<span style="font-size:.72rem;color:var(--success);font-weight:600">' + new Date(firstIn).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',hour12:true}) + '</span>';
      if (lastOut) outTimeHtml = '<span style="font-size:.72rem;color:var(--danger);font-weight:600">' + new Date(lastOut).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',hour12:true}) + '</span>';
      var h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
      if (totalMin > 0) {
        var color = totalMin >= 480 ? '#16a34a' : totalMin >= 240 ? '#d97706' : '#dc2626';
        hoursHtml = '<span style="font-size:.75rem;font-weight:700;color:' + color + '">' + h + 'h ' + m + 'm</span>';
      }
    }

    // Selfie column
    var selfieHtml = '<span style="color:var(--gray-300);font-size:.68rem">—</span>';
    if (log && log.selfie_checkin_url) {
      var selfieUrl = log.selfie_checkin_url + (log.selfie_checkin_url.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(JWT_TOKEN);
      selfieHtml = '<img src="' + escapeHTML(selfieUrl) + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:2px solid #16a34a;cursor:pointer" onclick="window.open(this.src,\'_blank\')" title="Check-in selfie">';
    }
    // Check-out selfie
    var selfieOutHtml = '';
    if (log && log.selfie_checkout_url) {
      var selfieOutUrl = log.selfie_checkout_url + (log.selfie_checkout_url.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(JWT_TOKEN);
      selfieOutHtml = '<img src="' + escapeHTML(selfieOutUrl) + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:2px solid #dc2626;cursor:pointer;margin-left:4px" onclick="window.open(this.src,\'_blank\')" title="Check-out selfie">';
    }
    var tdStyle = 'padding:8px 10px;border-bottom:1px solid var(--gray-100)';
    return '<tr>' +
      '<td style="' + tdStyle + ';font-size:.78rem;font-weight:600">' + escapeHTML(emp.code) + '</td>' +
      '<td style="' + tdStyle + ';font-size:.78rem">' + escapeHTML(emp.name) + '</td>' +
      '<td style="' + tdStyle + ';text-align:center">' + statusBadge + '</td>' +
      '<td style="' + tdStyle + ';text-align:center">' + inTimeHtml + '</td>' +
      '<td style="' + tdStyle + ';text-align:center">' + outTimeHtml + '</td>' +
      '<td style="' + tdStyle + ';text-align:center">' + hoursHtml + '</td>' +
      '<td style="' + tdStyle + ';text-align:center">' + selfieHtml + selfieOutHtml + '</td>' +
      '</tr>';
  });

  var thStyle = 'padding:8px 10px;text-align:left;font-size:.72rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--gray-200)';
  var html = '<div style="padding:10px 12px 6px;font-size:.75rem;color:var(--gray-500)">' + escapeHTML(dateLabel) + ' &mdash; <span style="color:#16a34a;font-weight:600">' + presentCount + ' Present</span> &middot; <span style="color:#dc2626;font-weight:600">' + absentCount + ' Absent</span></div>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr style="background:var(--gray-50)"><th style="' + thStyle + '">Emp Code</th><th style="' + thStyle + '">Name</th><th style="' + thStyle + ';text-align:center">Status</th><th style="' + thStyle + ';text-align:center">In</th><th style="' + thStyle + ';text-align:center">Out</th><th style="' + thStyle + ';text-align:center">Hours</th><th style="' + thStyle + ';text-align:center">Selfie</th></tr></thead>';
  html += '<tbody>' + rows.join('') + '</tbody></table></div>';

  if (activeEmps.length === 0) {
    html = '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.78rem">No employees found</div>';
  }
  area.innerHTML = html;
}

function filterAttEmpList() {
  var dept = (document.getElementById('attDeptFilter') || {}).value || '';
  var search = ((document.getElementById('attEmpSearch') || {}).value || '').toLowerCase();
  var filtered = EMPLOYEES.filter(function(e) {
    if (e.status === 'Inactive') return false;
    if (dept && e.dept !== dept) return false;
    if (search && e.name.toLowerCase().indexOf(search) === -1 && e.code.toLowerCase().indexOf(search) === -1) return false;
    return true;
  });
  var area = document.getElementById('attEmpListArea');
  if (!area) return;
  if (filtered.length === 0) { area.innerHTML = '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.78rem">No employees found</div>'; return; }
  area.innerHTML = filtered.map(function(e) {
    var init = e.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var sel = _hrAttSelectedEmp === e.code ? ' style="background:var(--primary-50);border-left:3px solid var(--primary)"' : '';
    return '<div class="request-item" onclick="selectAttEmployee(\'' + escapeAttr(e.code) + '\')"' + sel + '><div class="req-icon" style="background:var(--primary-50);color:var(--primary);font-size:.65rem;font-weight:700;width:28px;height:28px;min-width:28px;border-radius:8px;display:flex;align-items:center;justify-content:center">' + escapeHTML(init) + '</div><div class="req-info"><h4 style="font-size:.78rem">' + escapeHTML(e.name) + '</h4><p style="font-size:.65rem">' + escapeHTML(e.code) + ' &middot; ' + escapeHTML(e.dept) + '</p></div></div>';
  }).join('');
}

var _hrAttMonth = new Date();
_hrAttMonth.setDate(1);

function changeHrAttMonth(dir) {
  var now = new Date();
  var next = new Date(_hrAttMonth.getFullYear(), _hrAttMonth.getMonth() + dir, 1);
  if (next.getFullYear() > now.getFullYear() || (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())) return;
  _hrAttMonth = next;
  if (_hrAttSelectedEmp) selectAttEmployee(_hrAttSelectedEmp);
}

async function selectAttEmployee(empCode) {
  _hrAttSelectedEmp = empCode;
  filterAttEmpList();
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var area = document.getElementById('attEmpCalendarArea');
  if (!area) return;
  var now = new Date();
  var year = _hrAttMonth.getFullYear();
  var month = _hrAttMonth.getMonth();
  var isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var firstDayOfWeek = new Date(year, month, 1).getDay();
  var todayDate = isCurrentMonth ? now.getDate() : daysInMonth;
  var monthStr = year + '-' + String(month + 1).padStart(2, '0');

  // Show loading
  area.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:.78rem">Loading attendance data...</div>';

  // Fetch real attendance logs from API
  var logs = [];
  try {
    logs = await apiCall('GET', '/attendance?month=' + monthStr + '&empCode=' + encodeURIComponent(empCode));
    if (!Array.isArray(logs)) logs = [];
  } catch(e) { logs = []; }

  // Group sessions by day number (keep extra fields for detail view)
  var dayData = {};
  logs.forEach(function(row) {
    var d = row.log_date;
    if (!d) return;
    var dayNum = parseInt(d.substring(d.lastIndexOf('-') + 1), 10);
    if (!dayData[dayNum]) dayData[dayNum] = [];
    dayData[dayNum].push({
      checkIn: row.check_in || null,
      checkOut: row.check_out || null,
      location: row.location_name || '',
      remark: row.remark || '',
      geofence: !!row.is_within_geofence,
      selfieIn: row.selfie_checkin_url || null,
      selfieOut: row.selfie_checkout_url || null
    });
  });

  // Calculate per-day stats using the shared helper (handles P/H/L/A/holiday)
  var result = _computeCalendarStatuses(logs, empCode, year, month, todayDate);
  var att = result.att;
  var dayHours = result.dayHours;
  var presentCount = 0, halfCount = 0, absentCount = 0, leaveCount = 0;
  var monthTotalMin = 0;
  for (var d = 1; d <= todayDate; d++) {
    if (att[d] === 'present') { presentCount++; monthTotalMin += (dayHours[d] || 0); }
    else if (att[d] === 'half') { halfCount++; monthTotalMin += (dayHours[d] || 0); }
    else if (att[d] === 'leave') { leaveCount++; }
    else if (att[d] === 'absent') { absentCount++; }
  }
  var monthHrs = Math.floor(monthTotalMin / 60);
  var monthMins = Math.round(monthTotalMin % 60);

  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var html = '<div class="card fade-in" style="margin-bottom:10px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
  html += '<h4 style="font-size:.82rem;margin:0">' + escapeHTML(emp.name) + ' — ' + escapeHTML(emp.dept) + '</h4>';
  html += '</div>';
  // Month navigation
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px">';
  html += '<button class="cal-nav-btn" onclick="changeHrAttMonth(-1)" style="background:var(--gray-100);border:none;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>';
  html += '<span style="font-size:.78rem;font-weight:600;min-width:110px;text-align:center">' + monthNames[month] + ' ' + year + '</span>';
  html += '<button class="cal-nav-btn" onclick="changeHrAttMonth(1)" style="background:var(--gray-100);border:none;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer' + (isCurrentMonth ? ';opacity:.3;pointer-events:none' : '') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>';
  html += '</div>';
  // Summary stats
  html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px">';
  html += '<div class="summary-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--success)">' + presentCount + '</div><div style="font-size:.65rem;color:var(--gray-500)">Present</div></div>';
  html += '<div class="summary-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#d97706">' + halfCount + '</div><div style="font-size:.65rem;color:var(--gray-500)">Half Day</div></div>';
  html += '<div class="summary-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--danger)">' + absentCount + '</div><div style="font-size:.65rem;color:var(--gray-500)">Absent</div></div>';
  html += '<div class="summary-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#6366f1">' + leaveCount + '</div><div style="font-size:.65rem;color:var(--gray-500)">Leave</div></div>';
  html += '<div class="summary-card" style="padding:8px;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--primary)">' + monthHrs + 'h ' + monthMins + 'm</div><div style="font-size:.65rem;color:var(--gray-500)">Total Hours</div></div>';
  html += '</div>';
  // Calendar grid
  html += '<div class="cal-days" style="grid-template-columns:repeat(7,1fr);display:grid;gap:2px">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(dn) { html += '<div class="cal-day-label">' + dn + '</div>'; });
  for (var e2 = 0; e2 < firstDayOfWeek; e2++) html += '<div class="cal-day"></div>';
  var badgeMap = {present:{label:'P',cls:'cal-badge-present'},half:{label:'H',cls:'cal-badge-half'},absent:{label:'A',cls:'cal-badge-absent'},leave:{label:'L',cls:'cal-badge-leave'},holiday:{label:'H',cls:'cal-badge-holiday'}};
  for (var d2 = 1; d2 <= daysInMonth; d2++) {
    var isToday = isCurrentMonth && d2 === now.getDate();
    var st = d2 <= todayDate ? att[d2] || '' : '';
    var ymd2 = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d2).padStart(2, '0');
    if (!st && publicHolidays[ymd2]) st = 'holiday';
    var badge = st && badgeMap[st] ? '<span class="cal-status-badge ' + badgeMap[st].cls + '">' + badgeMap[st].label + '</span>' : '';
    var clickAttr = (dayData[d2] && dayData[d2].length > 0) ? ' onclick="showAttDayDetail(' + d2 + ')" style="cursor:pointer"' : '';
    var holidayTitle2 = publicHolidays[ymd2] ? ' title="' + escapeAttr(publicHolidays[ymd2].name) + '"' : '';
    html += '<div class="cal-day' + (isToday ? ' today' : '') + '"' + clickAttr + holidayTitle2 + '>' + d2 + badge + '</div>';
  }
  html += '</div>';
  // Day detail area
  html += '<div id="attDayDetailArea" style="margin-top:10px"></div>';
  html += '</div>';

  // Multi-month attendance history card (loaded async)
  html = '<div id="attEmpHistoryCard"></div>' + html;

  area.innerHTML = html;

  // Store dayData globally for detail view
  window._attDayData = dayData;
  window._attDayYear = year;
  window._attDayMonth = month;

  // Kick off the multi-month history table — focus on Present vs Absent
  loadAttendanceHistoryTable(empCode, emp);
}

// Build a 6-month history table for the selected employee.
// Counts: Present, Half day, Leave (with permission = approved), Absent (without permission).
async function loadAttendanceHistoryTable(empCode, emp) {
  var card = document.getElementById('attEmpHistoryCard');
  if (!card) return;
  card.innerHTML = '<div class="card fade-in" style="margin-bottom:10px;padding:14px"><div style="color:var(--gray-400);font-size:.78rem;text-align:center">Loading attendance history...</div></div>';

  var now = new Date();
  var monthsToFetch = 6;
  var months = [];
  for (var i = monthsToFetch - 1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      monthStr: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    });
  }

  // Fetch all months in parallel
  var fetches = months.map(function(m) {
    return apiCall('GET', '/attendance?month=' + m.monthStr + '&empCode=' + encodeURIComponent(empCode))
      .then(function(rows) { return Array.isArray(rows) ? rows : []; })
      .catch(function() { return []; });
  });

  var allLogs;
  try { allLogs = await Promise.all(fetches); }
  catch (e) { card.innerHTML = '<div class="card" style="padding:12px;color:var(--danger);font-size:.78rem">Failed to load history</div>'; return; }

  // Months before this date have no data — show as all-zero
  var DATA_START_YM = '2026-04'; // Dec 2025–Mar 2026 → blanked out

  // Per-month stats using the shared classifier
  var totals = { working: 0, present: 0, half: 0, leave: 0, absent: 0, hours: 0 };
  var rows = months.map(function(m, idx) {
    var c = { working:0, present:0, half:0, leave:0, absent:0, mins:0, noData:false };
    if (m.monthStr < DATA_START_YM) {
      c.noData = true;
      return { label: m.label, c: c };
    }
    var logs = allLogs[idx] || [];
    var lastDay = new Date(m.year, m.month + 1, 0).getDate();
    var stopDay = (m.year === now.getFullYear() && m.month === now.getMonth()) ? now.getDate() : lastDay;
    var result = _computeCalendarStatuses(logs, empCode, m.year, m.month, stopDay);
    var att = result.att, dh = result.dayHours;
    for (var d = 1; d <= stopDay; d++) {
      var s = att[d];
      if (s === 'holiday') continue;
      c.working++;
      if (s === 'present') { c.present++; c.mins += (dh[d] || 0); }
      else if (s === 'half') { c.half++; c.mins += (dh[d] || 0); }
      else if (s === 'leave') c.leave++;
      else if (s === 'absent') c.absent++;
    }
    totals.working += c.working;
    totals.present += c.present;
    totals.half    += c.half;
    totals.leave   += c.leave;
    totals.absent  += c.absent;
    totals.hours   += c.mins / 60;
    return { label: m.label, c: c };
  });

  // Build the card
  var html = '<div class="card fade-in" style="margin-bottom:10px;padding:14px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;flex-wrap:wrap">';
  html += '<div><h4 style="font-size:.88rem;margin:0;font-weight:700">Attendance History — ' + escapeHTML(emp.name) + '</h4>';
  html += '<div style="font-size:.68rem;color:var(--gray-500);margin-top:2px">Last ' + monthsToFetch + ' months · ' + escapeHTML(emp.code) + ' · ' + escapeHTML(emp.dept || '') + '</div></div></div>';

  // Headline cards — Present and Absent (the focus)
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
  html += _attHistTile('Present days', totals.present, '#22c55e', String(Math.round((totals.present / Math.max(1, totals.working)) * 100)) + '% of working');
  html += _attHistTile('Absent (no permission)', totals.absent, '#ef4444', String(Math.round((totals.absent / Math.max(1, totals.working)) * 100)) + '% of working');
  html += _attHistTile('Leave (with permission)', totals.leave, '#a855f7', 'Approved leaves');
  html += _attHistTile('Half days', totals.half, '#f59e0b', '<8h sessions');
  html += _attHistTile('Working days', totals.working, '#0ea5e9', 'Excl. Sun/holidays');
  html += _attHistTile('Total hours', Math.round(totals.hours) + 'h', '#3b82f6', 'Last 6 months');
  html += '</div>';

  // Per-month table
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.74rem;min-width:540px">';
  html += '<thead><tr style="text-align:left;color:var(--gray-500);background:var(--gray-50);border-bottom:2px solid var(--gray-100)">'
       + '<th style="padding:8px 10px">Month</th>'
       + '<th style="padding:8px 10px">Working</th>'
       + '<th style="padding:8px 10px;color:#16a34a">Present</th>'
       + '<th style="padding:8px 10px;color:#dc2626">Absent (no permission)</th>'
       + '<th style="padding:8px 10px;color:#9333ea">Leave (with permission)</th>'
       + '<th style="padding:8px 10px;color:#d97706">Half</th>'
       + '</tr></thead><tbody>';
  rows.forEach(function(r) {
    if (r.c.noData) {
      html += '<tr style="border-bottom:1px solid var(--gray-100);color:var(--gray-400)">'
           + '<td style="padding:8px 10px;font-weight:600">' + escapeHTML(r.label) + '</td>'
           + '<td style="padding:8px 10px" colspan="5"><span style="font-style:italic;font-size:.7rem">No data — system not yet in use</span></td>'
           + '</tr>';
      return;
    }
    html += '<tr style="border-bottom:1px solid var(--gray-100)">'
         + '<td style="padding:8px 10px;font-weight:600">' + escapeHTML(r.label) + '</td>'
         + '<td style="padding:8px 10px">' + r.c.working + '</td>'
         + '<td style="padding:8px 10px;font-weight:700;color:#16a34a">' + r.c.present + '</td>'
         + '<td style="padding:8px 10px;font-weight:700;color:#dc2626">' + r.c.absent + '</td>'
         + '<td style="padding:8px 10px;color:#9333ea">' + r.c.leave + '</td>'
         + '<td style="padding:8px 10px;color:#d97706">' + r.c.half + '</td>'
         + '</tr>';
  });
  // Totals row
  html += '<tr style="background:var(--gray-50);font-weight:700;border-top:2px solid var(--gray-200)">'
       + '<td style="padding:8px 10px">Total (6 mo)</td>'
       + '<td style="padding:8px 10px">' + totals.working + '</td>'
       + '<td style="padding:8px 10px;color:#16a34a">' + totals.present + '</td>'
       + '<td style="padding:8px 10px;color:#dc2626">' + totals.absent + '</td>'
       + '<td style="padding:8px 10px;color:#9333ea">' + totals.leave + '</td>'
       + '<td style="padding:8px 10px;color:#d97706">' + totals.half + '</td>'
       + '</tr>';
  html += '</tbody></table></div>';

  html += '</div>';
  card.innerHTML = html;
}

function _attHistTile(label, value, color, sub) {
  return '<div style="background:var(--card-bg);border:1px solid var(--gray-100);border-left:3px solid ' + color + ';border-radius:6px;padding:10px 12px">'
    + '<div style="font-size:.6rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:.4px;font-weight:600">' + escapeHTML(label) + '</div>'
    + '<div style="font-size:1.2rem;font-weight:700;color:' + color + ';margin-top:2px">' + escapeHTML(String(value)) + '</div>'
    + '<div style="font-size:.62rem;color:var(--gray-500);margin-top:2px">' + sub + '</div>'
    + '</div>';
}

function showAttDayDetail(dayNum) {
  var detailArea = document.getElementById('attDayDetailArea');
  if (!detailArea) return;
  var sessions = (window._attDayData || {})[dayNum];
  if (!sessions || sessions.length === 0) { detailArea.innerHTML = ''; return; }
  var year = window._attDayYear;
  var month = window._attDayMonth;
  var dateStr = new Date(year, month, dayNum).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
  var html = '<div class="card fade-in" style="background:var(--gray-50);padding:12px">';
  html += '<h4 style="font-size:.78rem;margin:0 0 8px 0;color:var(--gray-700)">' + escapeHTML(dateStr) + ' — ' + sessions.length + ' session' + (sessions.length > 1 ? 's' : '') + '</h4>';
  var dayTotalMin = 0;
  sessions.forEach(function(s, idx) {
    var inTime = s.checkIn ? new Date(s.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
    var outTime = s.checkOut ? new Date(s.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Active';
    var durStr = '—';
    if (s.checkIn) {
      var start = new Date(s.checkIn).getTime();
      var end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
      var mins = (end - start) / 60000;
      if (mins > 0) {
        dayTotalMin += mins;
        var h = Math.floor(mins / 60), m = Math.round(mins % 60);
        durStr = h + 'h ' + m + 'm';
      }
    }
    var geoIcon = s.geofence ? '<span style="color:var(--success)" title="Inside geofence">&#9679;</span>' : '<span style="color:var(--danger)" title="Outside geofence">&#9679;</span>';
    html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:.72rem">';
    html += '<span style="color:var(--gray-400);min-width:14px">' + (idx + 1) + '.</span>';
    html += geoIcon;
    html += '<span style="color:var(--success)">In: ' + escapeHTML(inTime) + '</span>';
    html += '<span style="color:var(--gray-300)">&rarr;</span>';
    html += '<span style="color:' + (s.checkOut ? 'var(--danger)' : 'var(--warning)') + '">Out: ' + escapeHTML(outTime) + '</span>';
    html += '<span style="color:var(--primary);font-weight:600;margin-left:auto">' + durStr + '</span>';
    html += '</div>';
    if (s.location) html += '<div style="font-size:.62rem;color:var(--gray-500);padding-left:30px">' + escapeHTML(s.location) + (s.remark ? ' — ' + escapeHTML(s.remark) : '') + '</div>';
    // Show selfie photos for HR/MD
    if (s.selfieIn || s.selfieOut) {
      html += '<div style="display:flex;gap:8px;padding:6px 0 4px 30px;flex-wrap:wrap">';
      if (s.selfieIn) {
        var selfieInUrl = s.selfieIn + (s.selfieIn.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(JWT_TOKEN);
        html += '<div style="text-align:center"><img src="' + escapeHTML(selfieInUrl) + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--success)" onclick="window.open(this.src,\'_blank\')" title="Check-in selfie"><div style="font-size:.58rem;color:var(--success);font-weight:600;margin-top:2px">Check-In</div></div>';
      }
      if (s.selfieOut) {
        var selfieOutUrl = s.selfieOut + (s.selfieOut.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(JWT_TOKEN);
        html += '<div style="text-align:center"><img src="' + escapeHTML(selfieOutUrl) + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--danger)" onclick="window.open(this.src,\'_blank\')" title="Check-out selfie"><div style="font-size:.58rem;color:var(--danger);font-weight:600;margin-top:2px">Check-Out</div></div>';
      }
      html += '</div>';
    }
  });
  var totalH = Math.floor(dayTotalMin / 60), totalM = Math.round(dayTotalMin % 60);
  html += '<div style="display:flex;justify-content:flex-end;padding-top:8px;font-size:.75rem;font-weight:700;color:var(--primary)">Total: ' + totalH + 'h ' + totalM + 'm</div>';
  html += '</div>';
  detailArea.innerHTML = html;
}

// =====================================================
// MISSED ATTENDANCE REQUESTS
// =====================================================

function showMissedAttendanceForm() {
  var area = document.getElementById('missedAttFormArea');
  if (!area) return;
  if (area.innerHTML.trim()) { area.innerHTML = ''; return; } // toggle
  var today = new Date().toISOString().split('T')[0];
  var html = '<div class="card fade-in" style="padding:14px;margin-bottom:12px;border-left:4px solid var(--warning,#f59e0b)">';
  html += '<h4 style="font-size:.85rem;font-weight:600;margin:0 0 10px 0">Missed Attendance Request</h4>';
  html += '<div class="form-row"><label>Date *</label><input type="date" id="missedAttDate" max="' + today + '" style="width:100%"></div>';
  html += '<div class="form-row"><label>Reason *</label><textarea id="missedAttReason" rows="2" placeholder="Why did you miss check-in? (e.g., phone was dead, forgot, etc.)" style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-size:.82rem"></textarea></div>';
  html += '<div class="form-row"><label>Attach Proof (optional)</label>';
  html += '<div class="camera-zone" onclick="document.getElementById(\'missedAttProof\').click()" style="padding:10px;margin-top:4px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  html += '<p style="font-size:.72rem;margin-top:4px">Tap to upload proof (screenshot, photo, etc.)</p>';
  html += '<input type="file" id="missedAttProof" accept="image/*" style="display:none" onchange="handleBillPreview(this,\'missedAttProofPreview\')"></div>';
  html += '<div id="missedAttProofPreview" style="display:none;margin-top:6px"></div></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="submitMissedAttendance()">Submit Request</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="document.getElementById(\'missedAttFormArea\').innerHTML=\'\'">Cancel</button></div>';
  html += '</div>';
  area.innerHTML = html;
}

async function submitMissedAttendance() {
  var date = (document.getElementById('missedAttDate') || {}).value;
  var reason = (document.getElementById('missedAttReason') || {}).value.trim();
  var proofInput = document.getElementById('missedAttProof');
  if (!date) { showToast('Please select the date you missed'); return; }
  if (!reason) { showToast('Please provide a reason'); return; }

  var btn = document.querySelector('#missedAttFormArea .nf-btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

  try {
    var fd = new FormData();
    fd.append('date', date);
    fd.append('reason', reason);
    if (proofInput && proofInput.files && proofInput.files[0]) fd.append('proof', proofInput.files[0]);
    await apiUpload('/attendance/missed', fd);
    showToast('Missed attendance request submitted. HR will review.');
    document.getElementById('missedAttFormArea').innerHTML = '';
    // Refresh missed requests
    loadMissedAttRequests();
  } catch (e) {
    showToast(e.message || 'Error submitting request');
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Request'; }
  }
}

// =====================================================
// PUBLIC HOLIDAYS (HR/MD manage; visible on every employee's calendar)
// =====================================================
async function loadPublicHolidays() {
  try {
    var resp = await apiCall('GET', '/holidays');
    var list = (resp && resp.data) || [];
    publicHolidaysList = list;
    publicHolidays = {};
    list.forEach(function(h) { publicHolidays[h.holiday_date] = h; });
  } catch (e) { /* non-fatal */ }
}

function renderPublicHolidaysPanel() {
  var area = document.getElementById('publicHolidaysArea');
  if (!area) return;
  if (!currentUser || (currentUser.role !== 'MD' && currentUser.role !== 'HR' && currentUser.role !== 'Manager')) { area.innerHTML = ''; return; }
  var todayIso = new Date().toISOString().split('T')[0];
  var html = '<div class="section-title" style="margin-top:4px">Public Holidays</div>';
  html += '<div class="card fade-in" style="padding:12px">';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px">';
  html += '<div style="flex:0 0 150px"><label style="font-size:.7rem;color:var(--gray-500);display:block;margin-bottom:3px">Date</label>';
  html += '<input type="date" id="phDate" min="' + todayIso + '" style="width:100%;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem"></div>';
  html += '<div style="flex:1;min-width:160px"><label style="font-size:.7rem;color:var(--gray-500);display:block;margin-bottom:3px">Holiday Name</label>';
  html += '<input type="text" id="phName" placeholder="e.g. Foundation Day" style="width:100%;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem"></div>';
  html += '<div style="flex:1;min-width:160px"><label style="font-size:.7rem;color:var(--gray-500);display:block;margin-bottom:3px">Description (optional)</label>';
  html += '<input type="text" id="phDesc" placeholder="Short note" style="width:100%;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem"></div>';
  html += '<button class="nf-btn nf-btn-primary nf-btn-sm" onclick="addPublicHoliday()" style="font-size:.75rem">Add Holiday</button>';
  html += '</div>';

  // Sorted list (upcoming first, then past)
  var upcoming = publicHolidaysList.filter(function(h) { return h.holiday_date >= todayIso; });
  var past = publicHolidaysList.filter(function(h) { return h.holiday_date < todayIso; });
  if (publicHolidaysList.length === 0) {
    html += '<div style="text-align:center;padding:14px;color:var(--gray-400);font-size:.78rem">No public holidays declared yet.</div>';
  } else {
    html += '<div style="font-size:.7rem;color:var(--gray-500);margin-bottom:4px;font-weight:600">Upcoming (' + upcoming.length + ')</div>';
    if (upcoming.length === 0) {
      html += '<div style="font-size:.72rem;color:var(--gray-400);padding:6px 0">No upcoming holidays.</div>';
    } else {
      upcoming.forEach(function(h) { html += renderHolidayRow(h, false); });
    }
    if (past.length > 0) {
      html += '<div style="font-size:.7rem;color:var(--gray-500);margin:10px 0 4px;font-weight:600">Past (' + past.length + ')</div>';
      past.slice(-5).reverse().forEach(function(h) { html += renderHolidayRow(h, true); });
    }
  }
  html += '</div>';
  area.innerHTML = html;
}

function renderHolidayRow(h, isPast) {
  var dateLabel = new Date(h.holiday_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
  var canDelete = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  var s = '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100);' + (isPast ? 'opacity:.6' : '') + '">';
  s += '<div style="flex:1"><div style="font-size:.8rem;font-weight:600">' + escapeHTML(h.name) + '</div>';
  s += '<div style="font-size:.68rem;color:var(--gray-500)">' + escapeHTML(dateLabel) + (h.description ? ' &middot; ' + escapeHTML(h.description) : '') + '</div></div>';
  if (canDelete) {
    s += '<button onclick="deletePublicHoliday(' + h.id + ')" style="font-size:.68rem;padding:4px 10px;border:1px solid #EF4444;color:#EF4444;background:transparent;border-radius:6px;cursor:pointer">Remove</button>';
  }
  s += '</div>';
  return s;
}

async function addPublicHoliday() {
  var date = (document.getElementById('phDate') || {}).value;
  var name = ((document.getElementById('phName') || {}).value || '').trim();
  var desc = ((document.getElementById('phDesc') || {}).value || '').trim();
  if (!date) { showToast('Please pick a date'); return; }
  if (!name) { showToast('Please enter the holiday name'); return; }
  try {
    await apiCall('POST', '/holidays', { date: date, name: name, description: desc });
    showToast('Holiday added');
    await loadPublicHolidays();
    renderPublicHolidaysPanel();
    // Refresh attendance calendar so new H badge appears
    if (typeof buildCalendar === 'function') buildCalendar();
  } catch (e) { showToast(e.message || 'Error adding holiday'); }
}

async function deletePublicHoliday(id) {
  if (!confirm('Remove this public holiday?')) return;
  try {
    await apiCall('DELETE', '/holidays/' + id);
    showToast('Holiday removed');
    await loadPublicHolidays();
    renderPublicHolidaysPanel();
    if (typeof buildCalendar === 'function') buildCalendar();
  } catch (e) { showToast(e.message || 'Error removing holiday'); }
}

async function loadMissedAttRequests() {
  var area = document.getElementById('missedAttMyRequests');
  if (!area || !currentUser) return;
  try {
    var data = await apiCall('GET', '/attendance/missed');
    if (!Array.isArray(data)) data = [];
    window._missedAttRequests = data;
    // For employees, show their own requests
    if (currentUser.role !== 'HR' && currentUser.role !== 'MD') {
      var myReqs = data.filter(function(r) { return r.emp_code === currentUser.code; });
      if (myReqs.length === 0) { area.innerHTML = ''; return; }
      var html = '<div class="section-title" style="font-size:.78rem">My Missed Attendance Requests</div>';
      html += '<div class="card fade-in" style="padding:10px">';
      myReqs.forEach(function(r) {
        var dateLabel = new Date(r.request_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        var badgeCls = r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
        var statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100)">';
        html += '<div style="flex:1"><div style="font-weight:600;font-size:.78rem">' + escapeHTML(dateLabel) + '</div>';
        html += '<div style="font-size:.68rem;color:var(--gray-500)">' + escapeHTML(r.reason) + '</div>';
        if (r.review_note) html += '<div style="font-size:.65rem;color:var(--gray-400);margin-top:2px">HR: ' + escapeHTML(r.review_note) + '</div>';
        html += '</div>';
        html += '<span class="badge-status ' + badgeCls + '">' + escapeHTML(statusLabel) + '</span></div>';
      });
      html += '</div>';
      area.innerHTML = html;
    }
  } catch (e) { /* silent */ }
}

// HR: Render missed attendance requests in Employee Attendance view
function renderMissedAttForHR() {
  var requests = window._missedAttRequests || [];
  var pending = requests.filter(function(r) { return r.status === 'pending'; });
  if (pending.length === 0) return '';

  var html = '<div style="margin-top:16px"><div class="section-title">Missed Attendance Requests <span style="background:var(--danger);color:#fff;font-size:.65rem;padding:1px 7px;border-radius:10px;margin-left:6px">' + pending.length + '</span></div>';
  html += '<div class="card fade-in" style="padding:10px">';
  pending.forEach(function(r) {
    var dateLabel = new Date(r.request_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    var empName = r.name || r.emp_code;
    html += '<div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<div style="flex:1"><div style="font-weight:600;font-size:.82rem">' + escapeHTML(empName) + ' <span style="font-weight:400;color:var(--gray-500);font-size:.72rem">(' + escapeHTML(r.emp_code) + ')</span></div>';
    html += '<div style="font-size:.72rem;color:var(--gray-500)">Date: <strong>' + escapeHTML(dateLabel) + '</strong>' + (r.dept ? ' &middot; ' + escapeHTML(r.dept) : '') + '</div>';
    html += '<div style="font-size:.72rem;color:var(--gray-600);margin-top:2px">Reason: ' + escapeHTML(r.reason) + '</div>';
    if (r.proof_url) {
      var proofUrl = r.proof_url + (r.proof_url.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(JWT_TOKEN);
      html += '<a href="' + escapeHTML(proofUrl) + '" target="_blank" style="font-size:.68rem;color:var(--primary);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:3px;margin-top:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>View Proof</a>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-top:6px">';
    html += '<button class="nf-btn nf-btn-success nf-btn-sm" onclick="approveMissedAtt(' + r.id + ')" style="font-size:.7rem">Approve</button>';
    html += '<button class="nf-btn nf-btn-danger nf-btn-sm" onclick="rejectMissedAtt(' + r.id + ')" style="font-size:.7rem">Reject</button>';
    html += '</div></div>';
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

async function approveMissedAtt(id) {
  var note = prompt('Add a note (optional):') || '';
  try {
    await apiCall('PUT', '/attendance/missed/' + id + '/approve', { note: note });
    showToast('Missed attendance approved — attendance marked');
    // Refresh data
    var data = await apiCall('GET', '/attendance/missed');
    window._missedAttRequests = Array.isArray(data) ? data : [];
    renderEmployeeAttendanceView();
  } catch (e) { showToast(e.message || 'Error approving'); }
}

async function rejectMissedAtt(id) {
  var note = prompt('Reason for rejection:') || '';
  try {
    await apiCall('PUT', '/attendance/missed/' + id + '/reject', { note: note });
    showToast('Request rejected');
    var data = await apiCall('GET', '/attendance/missed');
    window._missedAttRequests = Array.isArray(data) ? data : [];
    renderEmployeeAttendanceView();
  } catch (e) { showToast(e.message || 'Error rejecting'); }
}

// =====================================================
// CHANGE 2: EMPLOYEE LEAVE REQUEST — HR→MD DUAL APPROVAL
// =====================================================
var _leavesOriginalHTML = '';
function renderLeaveScreenForMode() {
  if (!currentUser) return;
  var container = document.getElementById('screen-leaves');
  if (!container) return;
  // Save original HTML on first call
  if (!_leavesOriginalHTML && container.querySelector('#leaveBalanceGrid')) {
    _leavesOriginalHTML = container.innerHTML;
  }
  // HR "Employee Leave Req" mode
  if (currentUser.role === 'HR' && _activeNavId === 'hr-att-leavereq') {
    renderHRLeaveRequests();
    return;
  }
  // Default — restore original HTML if it was replaced
  if (_leavesOriginalHTML && !container.querySelector('#leaveBalanceGrid')) {
    container.innerHTML = _leavesOriginalHTML;
  }
  renderLeaveScreen();
}

function renderHRLeaveRequests() {
  var container = document.getElementById('screen-leaves');
  if (!container) return;
  var pending = leaveApplications.filter(function(a) { return a.status === 'pending'; });
  var hrAccepted = leaveApplications.filter(function(a) { return a.status === 'hr_accepted'; });
  var others = leaveApplications.filter(function(a) { return a.status !== 'pending' && a.status !== 'hr_accepted'; });
  var html = '<div class="section-title" style="margin-top:4px">Employee Leave Requests</div>';
  // 3-step legend
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;font-size:.7rem;align-items:center;flex-wrap:wrap">';
  html += '<span style="padding:3px 8px;background:var(--warning-light);color:var(--warning-dark);border-radius:10px">1. Pending</span>';
  html += '<span style="color:var(--gray-400)">\u2192</span>';
  html += '<span style="padding:3px 8px;background:#DBEAFE;color:#1D4ED8;border-radius:10px">2. HR Accepted</span>';
  html += '<span style="color:var(--gray-400)">\u2192</span>';
  html += '<span style="padding:3px 8px;background:var(--success-light);color:var(--success-dark);border-radius:10px">3. MD Confirmed</span>';
  html += '</div>';
  if (pending.length > 0) {
    html += '<div class="section-title" style="font-size:.75rem;color:var(--warning-dark)">Pending (' + pending.length + ')</div>';
    pending.forEach(function(a) {
      var fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      var toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      html += '<div class="request-item" style="flex-wrap:wrap"><div class="req-icon" style="background:#FCE7F3;color:#DB2777"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="req-info"><h4>' + escapeHTML(a.empName) + ' — ' + escapeHTML(a.type) + ' Leave</h4><p>' + escapeHTML(a.dept) + ' &middot; ' + fromD + ' — ' + toD + ' &middot; ' + a.days + ' day(s)</p><p style="font-size:.65rem;color:var(--gray-500);margin-top:2px">' + escapeHTML(a.reason) + '</p></div><div class="leave-action-btns" style="width:100%;margin-top:8px"><button style="background:#DBEAFE;color:#1D4ED8" onclick="hrAcceptLeave(' + a.id + ')">Accept</button><button style="background:var(--danger-light);color:var(--danger-dark)" onclick="rejectLeave(' + a.id + ')">Reject</button></div></div>';
    });
  }
  if (hrAccepted.length > 0) {
    html += '<div class="section-title" style="font-size:.75rem;color:#1D4ED8;margin-top:12px">HR Accepted — Awaiting MD (' + hrAccepted.length + ')</div>';
    hrAccepted.forEach(function(a) {
      var fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      var toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      html += '<div class="request-item"><div class="req-icon" style="background:#DBEAFE;color:#1D4ED8"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/></svg></div><div class="req-info"><h4>' + escapeHTML(a.empName) + ' — ' + escapeHTML(a.type) + '</h4><p>' + escapeHTML(a.dept) + ' &middot; ' + fromD + ' — ' + toD + ' &middot; ' + a.days + ' day(s)</p></div><span class="badge-status" style="background:#DBEAFE;color:#1D4ED8">HR Accepted</span></div>';
    });
  }
  if (others.length > 0) {
    html += '<div class="section-title" style="font-size:.75rem;color:var(--gray-500);margin-top:12px">Resolved</div>';
    others.slice(0, 15).forEach(function(a) {
      var badgeCls = a.status === 'approved' ? 'badge-approved' : 'badge-rejected';
      var fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      var toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      html += '<div class="request-item"><div class="req-icon" style="background:#D1FAE5;color:#059669"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="req-info"><h4>' + escapeHTML(a.empName) + ' — ' + escapeHTML(a.type) + '</h4><p>' + escapeHTML(a.dept) + ' &middot; ' + fromD + ' — ' + toD + '</p></div><div class="req-meta"><span class="badge-status ' + badgeCls + '">' + escapeHTML(a.status) + '</span></div></div>';
    });
  }
  if (!pending.length && !hrAccepted.length && !others.length) {
    html += '<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:.78rem">No leave applications</div>';
  }
  container.innerHTML = html;
}

async function hrAcceptLeave(id) {
  try {
    var app = leaveApplications.find(function(a) { return a.id === id; });
    if (!app) return;
    await apiCall('PATCH', '/leaves/' + id + '/hr-accept');
    app.status = 'hr_accepted';
    showToast('Leave accepted — forwarded to MD for confirmation');
    refreshNotifications();
    renderHRLeaveRequests();
  } catch (err) { showToast(err.message || 'Error accepting leave'); }
}

// =====================================================
// CHANGE 3: ADVANCE DUAL APPROVAL (HR Accept → MD Confirm)
// =====================================================
function getAdvanceStatusBadge(status) {
  // New canonical statuses use the Accounts → MD → Accounts(Paid) flow.
  // Legacy hr_accepted/HR_Accepted values are kept for backwards display only —
  // the backend migration rewrites them to accounts_accepted on next deploy.
  if (status === 'accounts_accepted' || status === 'Accounts_Accepted') return '<span class="badge-status" style="background:#DBEAFE;color:#1D4ED8">Accounts Accepted</span>';
  if (status === 'hr_accepted' || status === 'HR_Accepted') return '<span class="badge-status" style="background:#FEF3C7;color:#92400E">HR Accepted (legacy)</span>';
  if (status === 'approved' || status === 'Approved') return '<span class="badge-status badge-approved">MD Approved</span>';
  if (status === 'paid' || status === 'Paid') return '<span class="badge-status" style="background:#D1FAE5;color:#065F46">Paid</span>';
  if (status === 'rejected' || status === 'Rejected') return '<span class="badge-status badge-rejected">Rejected</span>';
  return '<span class="badge-status badge-pending">Pending</span>';
}

function getAdvanceStepIndicator(status) {
  var s = String(status || '').toLowerCase();
  if (s === 'rejected') return '<div style="display:inline-flex;align-items:center;gap:4px;font-size:.65rem;color:var(--danger);font-weight:600"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Rejected</div>';
  var steps = [
    {label:'Submitted',        done: s !== 'pending',                                              active: s === 'pending'},
    {label:'Accts Accepted',   done: s === 'approved' || s === 'paid',                             active: s === 'accounts_accepted'},
    {label:'MD Approved',      done: s === 'paid',                                                 active: s === 'approved'},
    {label:'Paid',             done: false,                                                        active: s === 'paid'}
  ];
  var html = '<div style="display:flex;align-items:center;gap:0;font-size:.62rem">';
  steps.forEach(function(st, i) {
    var dotBg  = st.done ? 'var(--success)' : st.active ? 'var(--primary)' : 'var(--gray-200)';
    var dotClr = st.done || st.active ? '#fff' : 'var(--gray-400)';
    var lblClr = st.done ? 'var(--success-dark)' : st.active ? 'var(--primary)' : 'var(--gray-400)';
    var weight = st.active ? '700' : '500';
    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">';
    html += '<div style="width:16px;height:16px;border-radius:50%;background:' + dotBg + ';color:' + dotClr + ';display:flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:700">';
    html += st.done ? '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>' : (i + 1);
    html += '</div>';
    html += '<span style="color:' + lblClr + ';font-weight:' + weight + ';white-space:nowrap">' + st.label + '</span>';
    html += '</div>';
    if (i < steps.length - 1) {
      var lineClr = st.done ? 'var(--success)' : 'var(--gray-200)';
      html += '<div style="flex:1;height:2px;background:' + lineClr + ';min-width:12px;margin-bottom:14px"></div>';
    }
  });
  html += '</div>';
  return html;
}

// =====================================================
// CHANGE 7: SALARY — EMPLOYEE LIST VIEW
// =====================================================
function renderSalaryView() {
  if (!currentUser) return;
  var isMD = currentUser.role === 'MD';
  var isHR = currentUser.role === 'HR';
  var isAccounts = currentUser.dept === 'Accounts';
  // MD/HR/Accounts "Employee List" mode — show all employees salary table
  if ((isMD && _activeNavId === 'md-sal-structure') || (isHR && _activeNavId === 'hr-sal-list') || (isAccounts && _activeNavId === 'emp-acc-salary')) {
    renderEmployeeSalaryList();
    return;
  }
  // Default: render own salary (existing behavior)
  updateSalaryScreen();
}

function renderEmployeeSalaryList() {
  var container = document.getElementById('salaryContent');
  if (!container) return;
  var html = '<div class="section-title" style="margin-top:4px">Employee Salary Structure</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
  html += '<select id="salDeptFilter" onchange="renderEmpSalaryTable()" style="padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem"><option value="">All Departments</option>';
  var depts = [];
  EMPLOYEES.forEach(function(e) { if (depts.indexOf(e.dept) === -1) depts.push(e.dept); });
  depts.forEach(function(d) { html += '<option value="' + escapeAttr(d) + '">' + escapeHTML(d) + '</option>'; });
  html += '</select>';
  html += '<input type="text" id="salEmpSearch" oninput="renderEmpSalaryTable()" placeholder="Search by name/code..." style="flex:1;min-width:120px;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem">';
  html += '</div>';
  html += '<div id="empSalaryTableArea"></div>';
  container.innerHTML = html;
  renderEmpSalaryTable();
}

function renderEmpSalaryTable() {
  var canEditSalary = currentUser && (currentUser.dept === 'Accounts' || currentUser.role === 'MD' || currentUser.role === 'HR');
  var dept = (document.getElementById('salDeptFilter') || {}).value || '';
  var search = ((document.getElementById('salEmpSearch') || {}).value || '').toLowerCase();
  var filtered = EMPLOYEES.filter(function(e) {
    if (e.status === 'Inactive') return false;
    if (dept && e.dept !== dept) return false;
    if (search && e.name.toLowerCase().indexOf(search) === -1 && e.code.toLowerCase().indexOf(search) === -1) return false;
    return true;
  });
  var area = document.getElementById('empSalaryTableArea');
  if (!area) return;
  if (filtered.length === 0) { area.innerHTML = '<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:.78rem">No employees found</div>'; return; }
  var totalSalary = 0;
  var html = '<div class="card fade-in" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.72rem">';
  html += '<thead><tr style="background:var(--gray-50);text-align:left"><th style="padding:8px 6px">Name</th><th style="padding:8px 6px">Code</th><th style="padding:8px 6px">Dept</th><th style="padding:8px 6px">Designation</th><th style="padding:8px 6px;text-align:right">Salary</th><th style="padding:8px 6px">Bank</th>' + (canEditSalary ? '<th style="padding:8px 6px;text-align:center">Action</th>' : '') + '</tr></thead><tbody>';
  filtered.forEach(function(e) {
    totalSalary += e.salary;
    var basic = Math.round(e.salary * 0.5);
    var hra = Math.round(e.salary * 0.2);
    var da = Math.round(e.salary * 0.15);
    var other = e.salary - basic - hra - da;
    html += '<tr style="border-bottom:1px solid var(--gray-100);cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'table-row\':\'none\'">';
    html += '<td style="padding:8px 6px;font-weight:600">' + escapeHTML(e.name) + '</td>';
    html += '<td style="padding:8px 6px;color:var(--gray-500)">' + escapeHTML(e.code) + '</td>';
    html += '<td style="padding:8px 6px">' + escapeHTML(e.dept) + '</td>';
    html += '<td style="padding:8px 6px">' + escapeHTML(e.designation) + '</td>';
    html += '<td style="padding:8px 6px;text-align:right;font-weight:600">Rs.' + e.salary.toLocaleString('en-IN') + '</td>';
    html += '<td style="padding:8px 6px;font-size:.65rem">' + escapeHTML(e.bank || '') + '</td>';
    if (canEditSalary) html += '<td style="padding:8px 6px;text-align:center"><button class="btn btn-sm" style="font-size:.6rem;padding:2px 8px;background:var(--primary);color:#fff;border-radius:4px" onclick="event.stopPropagation();openSalaryEditForm(\'' + escapeAttr(e.code) + '\',' + e.salary + ')">Edit</button></td>';
    html += '</tr>';
    // Expandable salary breakdown row
    var colSpan = canEditSalary ? 7 : 6;
    html += '<tr style="display:none;background:var(--gray-50)"><td colspan="' + colSpan + '" style="padding:6px 12px;font-size:.68rem">';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">';
    html += '<div><strong>Basic:</strong> Rs.' + basic.toLocaleString('en-IN') + '</div>';
    html += '<div><strong>HRA:</strong> Rs.' + hra.toLocaleString('en-IN') + '</div>';
    html += '<div><strong>DA:</strong> Rs.' + da.toLocaleString('en-IN') + '</div>';
    html += '<div><strong>Other:</strong> Rs.' + other.toLocaleString('en-IN') + '</div>';
    html += '</div>';
    html += '<div style="margin-top:4px;color:var(--gray-500)">A/c: ' + escapeHTML(e.accNo || 'N/A') + '</div>';
    html += '</td></tr>';
  });
  html += '</tbody></table></div>';
  html += '<div class="card" style="margin-top:8px;padding:10px;display:flex;justify-content:space-between;font-size:.78rem"><span>Total Employees: <strong>' + filtered.length + '</strong></span><span>Total Monthly Payroll: <strong>Rs.' + totalSalary.toLocaleString('en-IN') + '</strong></span></div>';
  area.innerHTML = html;
}

// Salary edit form (Accounts dept / MD / HR)
function openSalaryEditForm(empCode, currentSalary) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var html = '<div class="card fade-in" style="padding:14px;margin:12px 0;border-left:4px solid var(--primary)">';
  html += '<h4 style="font-size:.85rem;font-weight:600;margin:0 0 10px 0">Update Salary — ' + escapeHTML(emp.name) + ' (' + escapeHTML(empCode) + ')</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html += '<div class="form-row"><label>Current Salary</label><input type="text" value="Rs.' + currentSalary.toLocaleString('en-IN') + '" readonly style="background:var(--gray-50);cursor:not-allowed"></div>';
  html += '<div class="form-row"><label>New Salary (Rs.) *</label><input type="number" id="newSalaryAmt" value="' + currentSalary + '" min="0" step="100"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:10px">';
  html += '<button class="nf-btn nf-btn-primary" onclick="saveSalaryUpdate(\'' + escapeAttr(empCode) + '\')">Update Salary</button>';
  html += '<button class="nf-btn nf-btn-outline" onclick="renderEmpSalaryTable()">Cancel</button>';
  html += '</div></div>';
  var area = document.getElementById('empSalaryTableArea');
  if (area) area.innerHTML = html + area.innerHTML;
}

async function saveSalaryUpdate(empCode) {
  var newSalary = parseFloat((document.getElementById('newSalaryAmt') || {}).value);
  if (isNaN(newSalary) || newSalary < 0) { showToast('Please enter a valid salary amount'); return; }
  try {
    await apiCall('PUT', '/salary/' + empCode, { salary: newSalary });
    // Update local data
    var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
    if (emp) emp.salary = newSalary;
    showToast('Salary updated for ' + empCode);
    renderEmpSalaryTable();
  } catch (e) {
    showToast(e.message || 'Error updating salary');
  }
}

// =====================================================
// CHANGE 8: TAX — FORM 16B, FORM 12B, TAX CALCULATOR
// =====================================================
var currentTaxEmpCode = null;
function switchTaxTab(tab) {
  currentTaxTab = tab;
  document.querySelectorAll('#taxTabs .tax-tab').forEach(function(t) { t.classList.remove('active'); });
  var tabMap = {declaration:1,summary:2,form16:3,form16b:4,form12b:5,calculator:6};
  var idx = tabMap[tab] || 1;
  var tabs = document.querySelectorAll('#taxTabs .tax-tab');
  if (tabs[idx-1]) tabs[idx-1].classList.add('active');
  renderTaxOverlayExtended();
}

function renderTaxOverlayExtended() {
  var c = document.getElementById('taxContent');
  if (!c || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';
  var empCode = (isMDorHR && currentTaxEmpCode) ? currentTaxEmpCode : currentUser.code;
  var dec = taxDeclarations[empCode] || {};
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; }) || currentUser;
  var html = '';

  // Employee selector for HR/MD
  if (isMDorHR) {
    html += '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center"><label style="font-size:.75rem;font-weight:600;white-space:nowrap">Employee:</label>';
    html += '<select id="taxEmpSelector" onchange="currentTaxEmpCode=this.value;renderTaxOverlayExtended()" style="flex:1;padding:6px 10px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.78rem">';
    html += '<option value="' + escapeAttr(currentUser.code) + '">Self (' + escapeHTML(currentUser.name) + ')</option>';
    EMPLOYEES.forEach(function(e) {
      if (e.code === currentUser.code) return;
      html += '<option value="' + escapeAttr(e.code) + '"' + (empCode === e.code ? ' selected' : '') + '>' + escapeHTML(e.name) + ' (' + escapeHTML(e.code) + ')</option>';
    });
    html += '</select></div>';
  }

  if (currentTaxTab === 'declaration') {
    html += '<div class="card"><div class="nf-section-title">IT Declaration FY 2025-26</div>';
    html += '<div class="ss-form-group"><label>Section 80C (Max Rs.1,50,000)</label><input type="number" class="tax-input" id="tax80C" value="' + (dec.sec80C||'') + '" placeholder="PPF, LIC, ELSS, etc."></div>';
    html += '<div class="ss-form-group"><label>Section 80D — Medical Insurance (Max Rs.25,000)</label><input type="number" class="tax-input" id="tax80D" value="' + (dec.sec80D||'') + '" placeholder="Health insurance premium"></div>';
    html += '<div class="ss-form-group"><label>HRA Exemption</label><input type="number" class="tax-input" id="taxHRA" value="' + (dec.hra||'') + '" placeholder="Monthly rent paid"></div>';
    html += '<div class="ss-form-group"><label>Home Loan Interest (Sec 24)</label><input type="number" class="tax-input" id="taxHomeLoan" value="' + (dec.homeLoan||'') + '" placeholder="Annual interest"></div>';
    html += '<button class="nf-btn nf-btn-primary" onclick="submitTaxDeclaration()">Submit Declaration</button>';
    if (dec.submittedOn) html += '<div style="font-size:.72rem;color:var(--success);margin-top:8px">Last submitted: ' + dec.submittedOn + '</div>';
    html += '</div>';
  } else if (currentTaxTab === 'summary') {
    var tax = calculateTaxLiability(empCode);
    html += '<div class="card"><div class="nf-section-title">Tax Computation Summary</div>';
    if (tax) {
      var rows = [['Annual Gross Salary', tax.annualGross],['(-) Standard Deduction', tax.stdDeduction],['(-) Section 80C', tax.sec80C],['(-) Section 80D', tax.sec80D],['(-) HRA Exemption', tax.hra],['Total Deductions', tax.totalDeductions],['Taxable Income', tax.taxableIncome],['Income Tax', tax.tax],['Cess (4%)', tax.cess]];
      rows.forEach(function(r) { html += '<div class="tax-summary-row"><span>' + r[0] + '</span><span>Rs.' + r[1].toLocaleString('en-IN') + '</span></div>'; });
      html += '<div class="tax-summary-row total"><span>Total Tax Liability</span><span>Rs.' + tax.totalTax.toLocaleString('en-IN') + '</span></div>';
      html += '<div style="margin-top:8px;font-size:.78rem;color:var(--gray-500)">Monthly TDS: Rs.' + tax.monthlyTds.toLocaleString('en-IN') + '</div>';
    } else { html += '<div class="nf-empty">Unable to compute tax</div>'; }
    html += '</div>';
  } else if (currentTaxTab === 'form16') {
    html += '<div class="card" style="text-align:center;padding:24px"><div class="nf-section-title">Form 16 — AY 2026-27</div>';
    html += '<p style="font-size:.82rem;color:var(--gray-500);margin-bottom:12px">Download Form 16 certificate for Assessment Year 2026-27</p>';
    html += '<button class="nf-btn nf-btn-primary" onclick="generateForm16PDF()">Download Form 16 PDF</button></div>';
  } else if (currentTaxTab === 'form16b') {
    html += '<div class="card"><div class="nf-section-title">Form 16B — TDS on Property (Sec 194-IA)</div>';
    html += '<p style="font-size:.78rem;color:var(--gray-500);margin-bottom:12px">TDS certificate for property purchase exceeding Rs.50 Lakhs</p>';
    html += '<div class="ss-form-group"><label>Buyer Name</label><input type="text" id="f16bBuyer" value="' + escapeAttr(emp.name) + '" placeholder="Buyer full name"></div>';
    html += '<div class="ss-form-group"><label>Buyer PAN</label><input type="text" id="f16bBuyerPan" value="' + escapeAttr(emp.pan || '') + '" placeholder="PAN number" maxlength="10"></div>';
    html += '<div class="ss-form-group"><label>Seller Name</label><input type="text" id="f16bSeller" placeholder="Seller full name"></div>';
    html += '<div class="ss-form-group"><label>Seller PAN</label><input type="text" id="f16bSellerPan" placeholder="Seller PAN" maxlength="10"></div>';
    html += '<div class="ss-form-group"><label>Property Value (Rs.)</label><input type="number" id="f16bPropertyVal" placeholder="e.g. 7500000"></div>';
    html += '<div id="f16bTdsCalc" style="margin:8px 0;font-size:.78rem;color:var(--primary)"></div>';
    html += '<button class="nf-btn nf-btn-primary" onclick="calcForm16BTDS()">Calculate TDS</button>';
    html += '</div>';
  } else if (currentTaxTab === 'form12b') {
    html += '<div class="card"><div class="nf-section-title">Form 12B — Previous Employer Declaration</div>';
    html += '<p style="font-size:.78rem;color:var(--gray-500);margin-bottom:12px">Declare income from previous employer for current FY</p>';
    html += '<div class="ss-form-group"><label>Previous Employer Name</label><input type="text" id="f12bPrevEmp" value="' + escapeAttr(dec.prevEmployer || '') + '" placeholder="Company name"></div>';
    html += '<div class="ss-form-group"><label>Period of Employment</label><div style="display:flex;gap:8px"><input type="date" id="f12bFrom" value="' + escapeAttr(dec.prevFrom || '') + '" style="flex:1"><input type="date" id="f12bTo" value="' + escapeAttr(dec.prevTo || '') + '" style="flex:1"></div></div>';
    html += '<div class="ss-form-group"><label>Gross Salary from Previous Employer (Rs.)</label><input type="number" id="f12bGross" value="' + (dec.prevGross || '') + '" placeholder="Total gross salary"></div>';
    html += '<div class="ss-form-group"><label>TDS Deducted by Previous Employer (Rs.)</label><input type="number" id="f12bTds" value="' + (dec.prevTds || '') + '" placeholder="TDS amount"></div>';
    html += '<button class="nf-btn nf-btn-primary" onclick="submitForm12B()">Save Declaration</button>';
    if (dec.form12bSubmitted) html += '<div style="font-size:.72rem;color:var(--success);margin-top:8px">Saved on: ' + dec.form12bSubmitted + '</div>';
    html += '</div>';
  } else if (currentTaxTab === 'calculator') {
    html += '<div class="card"><div class="nf-section-title">Income Tax Calculator</div>';
    html += '<div class="ss-form-group"><label>Annual Gross Salary (Rs.)</label><input type="number" id="taxCalcGross" value="' + ((emp.salary || 0) * 12) + '" placeholder="Annual gross salary"></div>';
    html += '<div class="ss-form-group"><label>80C Deductions (Rs.)</label><input type="number" id="taxCalc80C" value="0" placeholder="PPF, LIC, ELSS, etc."></div>';
    html += '<div class="ss-form-group"><label>80D Deductions (Rs.)</label><input type="number" id="taxCalc80D" value="0" placeholder="Health insurance"></div>';
    html += '<button class="nf-btn nf-btn-primary" onclick="runTaxCalculator()" style="margin-bottom:12px">Calculate Tax</button>';
    html += '<div id="taxCalcResult"></div></div>';
  }
  c.innerHTML = html;
}

function calcForm16BTDS() {
  var val = parseInt((document.getElementById('f16bPropertyVal') || {}).value, 10) || 0;
  var el = document.getElementById('f16bTdsCalc');
  if (!el) return;
  if (val <= 5000000) { el.innerHTML = '<span style="color:var(--success)">No TDS applicable — property value is Rs.50 Lakhs or below</span>'; return; }
  var tds = Math.round(val * 0.01);
  el.innerHTML = '<strong>TDS @1%:</strong> Rs.' + tds.toLocaleString('en-IN') + '<br><span style="font-size:.7rem;color:var(--gray-500)">Applicable under Section 194-IA for property value exceeding Rs.50 Lakhs</span>';
}

async function submitForm12B() {
  var empCode = (currentUser.role === 'MD' || currentUser.role === 'HR') && currentTaxEmpCode ? currentTaxEmpCode : currentUser.code;
  var dec = taxDeclarations[empCode] || {};
  dec.prevEmployer = (document.getElementById('f12bPrevEmp') || {}).value || '';
  dec.prevFrom = (document.getElementById('f12bFrom') || {}).value || '';
  dec.prevTo = (document.getElementById('f12bTo') || {}).value || '';
  dec.prevGross = parseInt((document.getElementById('f12bGross') || {}).value, 10) || 0;
  dec.prevTds = parseInt((document.getElementById('f12bTds') || {}).value, 10) || 0;
  dec.form12bSubmitted = new Date().toISOString().split('T')[0];
  taxDeclarations[empCode] = dec;
  try {
    await apiCall('POST', '/tax/form12b', {
      prev_employer: dec.prevEmployer, prev_from: dec.prevFrom || null, prev_to: dec.prevTo || null,
      prev_gross: dec.prevGross, prev_tds: dec.prevTds
    });
    showToast('Form 12B declaration saved');
  } catch (e) { showToast('Failed to save Form 12B'); }
  renderTaxOverlayExtended();
}

function runTaxCalculator() {
  var gross = parseInt((document.getElementById('taxCalcGross') || {}).value, 10) || 0;
  var d80c = Math.min(parseInt((document.getElementById('taxCalc80C') || {}).value, 10) || 0, 150000);
  var d80d = Math.min(parseInt((document.getElementById('taxCalc80D') || {}).value, 10) || 0, 25000);
  var stdDed = 50000;
  var totalDed = stdDed + d80c + d80d;
  var taxable = Math.max(0, gross - totalDed);
  // Old regime calculation
  var oldTax = 0;
  TAX_SLABS_OLD.forEach(function(s) {
    if (taxable > s.min) { oldTax += Math.min(taxable, s.max === Infinity ? taxable : s.max) * s.rate / 100 - s.min * s.rate / 100; }
  });
  var oldCess = Math.round(oldTax * 0.04);
  var oldTotal = Math.round(oldTax + oldCess);
  // New regime (simplified)
  var newSlabs = [{min:0,max:300000,rate:0},{min:300000,max:700000,rate:5},{min:700000,max:1000000,rate:10},{min:1000000,max:1200000,rate:15},{min:1200000,max:1500000,rate:20},{min:1500000,max:Infinity,rate:30}];
  var newTaxable = Math.max(0, gross - 75000);
  var newTax = 0;
  newSlabs.forEach(function(s) {
    if (newTaxable > s.min) {
      var upper = s.max === Infinity ? newTaxable : Math.min(newTaxable, s.max);
      newTax += (upper - s.min) * s.rate / 100;
    }
  });
  var newCess = Math.round(newTax * 0.04);
  var newTotal = Math.round(newTax + newCess);
  var el = document.getElementById('taxCalcResult');
  if (!el) return;
  var better = oldTotal <= newTotal ? 'Old' : 'New';
  el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div class="card" style="padding:12px;text-align:center' + (better === 'Old' ? ';border:2px solid var(--success)' : '') + '"><div style="font-size:.72rem;font-weight:700;margin-bottom:4px">Old Regime</div><div style="font-size:.68rem;color:var(--gray-500)">Taxable: Rs.' + taxable.toLocaleString('en-IN') + '</div><div style="font-size:1rem;font-weight:700;color:var(--primary);margin:4px 0">Rs.' + oldTotal.toLocaleString('en-IN') + '</div><div style="font-size:.6rem;color:var(--gray-400)">Tax: ' + Math.round(oldTax).toLocaleString('en-IN') + ' + Cess: ' + oldCess.toLocaleString('en-IN') + '</div></div>' +
    '<div class="card" style="padding:12px;text-align:center' + (better === 'New' ? ';border:2px solid var(--success)' : '') + '"><div style="font-size:.72rem;font-weight:700;margin-bottom:4px">New Regime</div><div style="font-size:.68rem;color:var(--gray-500)">Taxable: Rs.' + newTaxable.toLocaleString('en-IN') + '</div><div style="font-size:1rem;font-weight:700;color:var(--primary);margin:4px 0">Rs.' + newTotal.toLocaleString('en-IN') + '</div><div style="font-size:.6rem;color:var(--gray-400)">Tax: ' + Math.round(newTax).toLocaleString('en-IN') + ' + Cess: ' + newCess.toLocaleString('en-IN') + '</div></div>' +
    '</div><div style="text-align:center;margin-top:8px;font-size:.75rem;color:var(--success);font-weight:600">' + better + ' Regime saves Rs.' + Math.abs(oldTotal - newTotal).toLocaleString('en-IN') + '</div>';
}

// =====================================================
// INITIALIZATION — LOAD DATA & AUTO-LOGIN
// =====================================================
(async function initApp() {
  initDarkMode();
  // Restore JWT if available
  JWT_TOKEN = safeStorage.get('hrms_jwt') || null;

  // Check for Google OAuth2 redirect (token in sessionStorage or URL hash)
  var _hasGoogleToken = sessionStorage.getItem('hrms_google_token') || (location.hash && location.hash.includes('access_token'));
  if (_hasGoogleToken) {
    // Show loading state while processing Google login
    var errEl = document.getElementById('loginError');
    if (errEl) errEl.textContent = 'Signing in with Google...';
    var btn = document.getElementById('googleSignInBtn');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Signing in...'; }
    try {
      await _handleGoogleRedirect();
    } catch (e) {
      if (errEl) errEl.textContent = 'Google Sign-In failed. Please try again.';
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Sign in with Google'; }
    }
  } else if (!(await tryAutoLogin())) {
    // Show login screen (default state)
  } else {
    resetIdleTimer();
    restoreNotifPrefToggles();
    renderNotifications();
    updateNotifBadge();
  }

  // Login button event listeners (no inline onclick — CSP safe)
  var signInBtn = document.getElementById('signInBtn');
  if (signInBtn) signInBtn.addEventListener('click', function() { doLogin(); });
  var biometricBtn = document.getElementById('biometricBtn');
  if (biometricBtn) biometricBtn.addEventListener('click', function() { biometricLogin(); });
  // Google Sign-In button
  var googleBtn = document.getElementById('googleSignInBtn');
  if (googleBtn) googleBtn.addEventListener('click', function() { googleSignIn(); });
  var loginPass = document.getElementById('loginPass');
  if (loginPass) loginPass.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
})();
