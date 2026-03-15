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
const COMPANY_LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAKMWlDQ1BJQ0MgUHJvZmlsZQAAeJydlndUU9kWh8+9N71QkhCKlNBraFICSA29SJEuKjEJEErAkAAiNkRUcERRkaYIMijggKNDkbEiioUBUbHrBBlE1HFwFBuWSWStGd+8ee/Nm98f935rn73P3Wfvfda6AJD8gwXCTFgJgAyhWBTh58WIjYtnYAcBDPAAA2wA4HCzs0IW+EYCmQJ82IxsmRP4F726DiD5+yrTP4zBAP+flLlZIjEAUJiM5/L42VwZF8k4PVecJbdPyZi2NE3OMErOIlmCMlaTc/IsW3z2mWUPOfMyhDwZy3PO4mXw5Nwn4405Er6MkWAZF+cI+LkyviZjg3RJhkDGb+SxGXxONgAoktwu5nNTZGwtY5IoMoIt43kA4EjJX/DSL1jMzxPLD8XOzFouEiSniBkmXFOGjZMTi+HPz03ni8XMMA43jSPiMdiZGVkc4XIAZs/8WRR5bRmyIjvYODk4MG0tbb4o1H9d/JuS93aWXoR/7hlEH/jD9ld+mQ0AsKZltdn6h21pFQBd6wFQu/2HzWAvAIqyvnUOfXEeunxeUsTiLGcrq9zcXEsBn2spL+jv+p8Of0NffM9Svt3v5WF485M4knQxQ143bmZ6pkTEyM7icPkM5p+H+B8H/nUeFhH8JL6IL5RFRMumTCBMlrVbyBOIBZlChkD4n5r4D8P+pNm5lona+BHQllgCpSEaQH4eACgqESAJe2Qr0O99C8ZHA/nNi9GZmJ37z4L+fVe4TP7IFiR/jmNHRDK4ElHO7Jr8WgI0IABFQAPqQBvoAxPABLbAEbgAD+ADAkEoiARxYDHgghSQAUQgFxSAtaAYlIKtYCeoBnWgETSDNnAYdIFj4DQ4By6By2AE3AFSMA6egCnwCsxAEISFyBAVUod0IEPIHLKFWJAb5AMFQxFQHJQIJUNCSAIVQOugUqgcqobqoWboW+godBq6AA1Dt6BRaBL6FXoHIzAJpsFasBFsBbNgTzgIjoQXwcnwMjgfLoK3wJVwA3wQ7oRPw5fgEVgKP4GnEYAQETqiizARFsJGQpF4JAkRIauQEqQCaUDakB6kH7mKSJGnyFsUBkVFMVBMlAvKHxWF4qKWoVahNqOqUQdQnag+1FXUKGoK9RFNRmuizdHO6AB0LDoZnYsuRlegm9Ad6LPoEfQ4+hUGg6FjjDGOGH9MHCYVswKzGbMb0445hRnGjGGmsVisOtYc64oNxXKwYmwxtgp7EHsSewU7jn2DI+J0cLY4X1w8TogrxFXgWnAncFdwE7gZvBLeEO+MD8Xz8MvxZfhGfA9+CD+OnyEoE4wJroRIQiphLaGS0EY4S7hLeEEkEvWITsRwooC4hlhJPEQ8TxwlviVRSGYkNimBJCFtIe0nnSLdIr0gk8lGZA9yPFlM3kJuJp8h3ye/UaAqWCoEKPAUVivUKHQqXFF4pohXNFT0VFysmK9YoXhEcUjxqRJeyUiJrcRRWqVUo3RU6YbStDJV2UY5VDlDebNyi/IF5UcULMWI4kPhUYoo+yhnKGNUhKpPZVO51HXURupZ6jgNQzOmBdBSaaW0b2iDtCkVioqdSrRKnkqNynEVKR2hG9ED6On0Mvph+nX6O1UtVU9Vvuom1TbVK6qv1eaoeajx1UrU2tVG1N6pM9R91NPUt6l3qd/TQGmYaYRr5Grs0Tir8XQObY7LHO6ckjmH59zWhDXNNCM0V2ju0xzQnNbS1vLTytKq0jqj9VSbru2hnaq9Q/uE9qQOVcdNR6CzQ+ekzmOGCsOTkc6oZPQxpnQ1df11Jbr1uoO6M3rGelF6hXrtevf0Cfos/ST9Hfq9+lMGOgYhBgUGrQa3DfGGLMMUw12G/YavjYyNYow2GHUZPTJWMw4wzjduNb5rQjZxN1lm0mByzRRjyjJNM91tetkMNrM3SzGrMRsyh80dzAXmu82HLdAWThZCiwaLG0wS05OZw2xljlrSLYMtCy27LJ9ZGVjFW22z6rf6aG1vnW7daH3HhmITaFNo02Pzq62ZLde2xvbaXPJc37mr53bPfW5nbse322N3055qH2K/wb7X/oODo4PIoc1h0tHAMdGx1vEGi8YKY21mnXdCO3k5rXY65vTW2cFZ7HzY+RcXpkuaS4vLo3nG8/jzGueNueq5clzrXaVuDLdEt71uUnddd457g/sDD30PnkeTx4SnqWeq50HPZ17WXiKvDq/XbGf2SvYpb8Tbz7vEe9CH4hPlU+1z31fPN9m31XfKz95vhd8pf7R/kP82/xsBWgHcgOaAqUDHwJWBfUGkoAVB1UEPgs2CRcE9IXBIYMj2kLvzDecL53eFgtCA0O2h98KMw5aFfR+OCQ8Lrwl/GGETURDRv4C6YMmClgWvIr0iyyLvRJlESaJ6oxWjE6Kbo1/HeMeUx0hjrWJXxl6K04gTxHXHY+Oj45vipxf6LNy5cDzBPqE44foi40V5iy4s1licvvj4EsUlnCVHEtGJMYktie85oZwGzvTSgKW1S6e4bO4u7hOeB28Hb5Lvyi/nTyS5JpUnPUp2Td6ePJninlKR8lTAFlQLnqf6p9alvk4LTduf9ik9Jr09A5eRmHFUSBGmCfsytTPzMoezzLOKs6TLnJftXDYlChI1ZUPZi7K7xTTZz9SAxESyXjKa45ZTk/MmNzr3SJ5ynjBvYLnZ8k3LJ/J9879egVrBXdFboFuwtmB0pefK+lXQqqWrelfrry5aPb7Gb82BtYS1aWt/KLQuLC98uS5mXU+RVtGaorH1futbixWKRcU3NrhsqNuI2ijYOLhp7qaqTR9LeCUXS61LK0rfb+ZuvviVzVeVX33akrRlsMyhbM9WzFbh1uvb3LcdKFcuzy8f2x6yvXMHY0fJjpc7l+y8UGFXUbeLsEuyS1oZXNldZVC1tep9dUr1SI1XTXutZu2m2te7ebuv7PHY01anVVda926vYO/Ner/6zgajhop9mH05+x42Rjf2f836urlJo6m06cN+4X7pgYgDfc2Ozc0tmi1lrXCrpHXyYMLBy994f9Pdxmyrb6e3lx4ChySHHn+b+O31w0GHe4+wjrR9Z/hdbQe1o6QT6lzeOdWV0iXtjusePhp4tLfHpafje8vv9x/TPVZzXOV42QnCiaITn07mn5w+lXXq6enk02O9S3rvnIk9c60vvG/wbNDZ8+d8z53p9+w/ed71/LELzheOXmRd7LrkcKlzwH6g4wf7HzoGHQY7hxyHui87Xe4Znjd84or7ldNXva+euxZw7dLI/JHh61HXb95IuCG9ybv56Fb6ree3c27P3FlzF3235J7SvYr7mvcbfjT9sV3qID0+6j068GDBgztj3LEnP2X/9H686CH5YcWEzkTzI9tHxyZ9Jy8/Xvh4/EnWk5mnxT8r/1z7zOTZd794/DIwFTs1/lz0/NOvm1+ov9j/0u5l73TY9P1XGa9mXpe8UX9z4C3rbf+7mHcTM7nvse8rP5h+6PkY9PHup4xPn34D94Tz+6TMXDkAABpBSURBVHja5X17lF1lledv7+8759x6VyUkAYQw2MgjcXrsRcM4LKEqarczDnYreotUAqYJEloBddRBF619c7uHdqkz3e1jYHgIhKTyqDvt0GumXbbKkNtiq00zdqsJIjQgj/DIo573dc737T1/nHtv3apUhUpSPIxnrVqrVlWde75vn/387d+3i/DKXYTsCAMACoN++ofAyg1/0TtWW3JmwubNTs3pUPcmT+ZchG1nhJXRfGVk423of8CiuMYBQOP7aO3d17iw97NIKvuMys9A9EzA8gR85cenmMoz/zL8sQltXUF/zmL5akVhUADoK7FJu/gfqYRsgVEY9A3B/eYVX+p4VJZdCLED3tCFzyX0ZmU6RUzGgA0UCngH2DZ4nuic95Nh+sR2rFTRld4EbyUFnDiAwuRJ6dpn129/jJSLofHfa6uOPry/cP1U8+bsiEEhKwDp61SASujfbFAkhwL8+effFjyyquftTpDdI/w7aqKVEllAFfAJIA7wscCrAgwAHt4FAMn8Ok0OEivEJZDYAIAoEzEFwuEZnsMzwPadzldRCcwz4brh71h1Ixfsu+v+YmHQvRKCXBwBZkcMCuRRhDs5++VlY+Hyq/+Z+IOewvM0CAAXA64qcBCQEhQMIgLAqVFrqmAEOvI7ElIQAcoAGQUAUqiqwqmCvAKqompgwtO9DTcmkmx88PTr9rSt/9AdvVIefn7H4IHpNU+7lmO9+LjuzuUYUEJh0J+c/fqyjnXbb94fnfrTWtD1eUfReUhqgnjSwycCAoNgATJ14S2muyUQGFADwIKI4BNBXHKaxOIpXF0Ne//yJe7dEw3t2Hxa9o4lKAx6qFK6h9dCgNkRg3xeCKTt67duPBB2/Lgc9dzkwSs0nvJwNVEiBtikm2uEkFckXB0eI9JnWhAYvipaLXlPdnmc6c49H/X8OBq69yoiUuTzguyIeXVNuD9nURh0S9ffec4Edd9atW1rxMVAbdJBYUBkZsuKFKrkPZSZCKzTpnvc0ku9GUEBnzpZNUCrlhODAEiiWku852ClRH132fU7L2uPX/roeGHwyRlR/xXUQEJ2xKCYd51rv/6BMer5QWLb10hccvCJAmQPN0/1gHo1lhB1Ww5CJmIQ/CJppNRFxOAgYxC0W3BIAPn02bNMHWThnWhc8knQdWkpOuWhnsvvzKK4xtU1kV4hASpBFVQY9NG6e/6kHC0reFAf4ik/t+AkXXzQZihoN0bc8zaeGI6qB36vXWubyGYA1aNTQZ1rvQQiQqcvD2Uq+zeEbmoni3uBbWQQdJjplzjbvMmgNuEdzNKp6KSRzNp7c1QY9MjlCFBaZAEqIbeZcpuJonX3/o84XP45cTUP7wUgM9NUVUhJKew0TIwgqdwfufErz+gcO88ND11RGbnmf0cWj4MYR23D1HhLrbepggiRxyPlkavvjYeHhk7DgVWhL62zSenbzIxUkKoEnZkiERv4WLyLfdx20uZg3fZbKJ8X5LBgIdqFmW2BKZ/3X1y3daQWnZRFbcwR2CrN9mPiNew0RmqgpLqzLZn68tTIVT9MADyRBp4QgBeqtR9rzJtP4s6Y9nrlwU9vHxwFsIOAHZn1O9/qfOU/e2MvEwoIruIBmKalEjFBFdWpJMks+XC4brg9ztMfaHbEoICXrWB4AQHDoDDoo7Vbb6tGS7Nam0gUbGcGARVAlcIuY3zlwYyfersfzg5Njlz1Q83lOPUtSgA8CoOe1CaYw3pJ08z4SHngnB5KFeKlhmLeIQ0khOyI0ZxyZXjtD922wfcHUlljfO3vKeoyBCgpZNozgIQ00Op4EmeWbgiGtnyNCoMe/Q+Y49PA/pxFMe+itVtujtuWbtLaZAIgaD4WBBA8ODCsgjAeu6m2/YrPlxppzqqsIt9aWYzUFVUVrAoiRVOSpEiD8/wCZK2/NdLpt0cAVB2bNIKuyqa/LyD1ezllBVDL0+4ccPEX1g9/NuZMXogIPvYzXBBpoJWJJMksu67t8nv2lXet+bOGDI5eA+vRtm3t19+XRH03aTzlCGpnBinvYTImkOSlTDL1rur2Kz6vOeVmlp+fryxzIDZExIbYUPo9AmJD0CMk2Z7qf6tB8z42RMyk4ua+L0+CPAmyIyYP1erw+j/JJJPvNiovwGZMM9g1XgapRa3samHvzW1r7/k9FPPuSHkizVth5POy7PJ7fmM0aP9/Tk0nNCaAqdXfUdBpjJva01t58X0HvvHxxxaQSxEAXZYd6Zwy1dUgUainRlUGNsy++mRp5zUvpibfrFcJgHasvWOF2I5/hbgqMC1r8aJLdfRnzxY+WXlZl7TptgC3X5v0rLvljVM46ZsSZM7RpOQBNtOKKKIckSE/1l079JbRwqZngM0E5GVhAsyOmCwKuM/+/gMu7Lk4fcCMaCuwGba+uqfHv/S7B3fesO9YE9HX5Kqvdcn6L582Tiu+67n9HLjyrD2KR9hpgtrYA27HlW/XeWpnmhsYGPTtQ/dcVc0su0uqUw5EdkbAMBEHvrqvW56+4ODOT+97OT9xRKxw9nVEpKQOlc1531ECA/U19172tTMm21d8z5M5HS4WEE2XnSqOo07bVnl+fWnXNdvnAiDosAViM61ct6LnOfTt8RytgE/QdOyqCmOFFdJbHb/40F9d/aPFQjVeG01Mhdg9dOuFJXPS9z2IIJ6bclEITEDGV/edyftXPT58aArYrK0veObbzBYYyMvz2vEZH/WcAh/LjKhIEDKhiZKJGw791dU/Qv8D9ldWeABQzDv0P2Andnz4H8Jk/FNkMwatyTaBITXxmZ43/NIvvRHIy2wLaNHAHAN57bvyttMnpG+Ph2mHJjRdlGvdJxz6X27HBy/TXyWftwBNpGLe2bVbv5VE3e9CUm4JKqqgQI0kU0vcgXP2F657sTWgTEuzf4ABaDmJNknY2QlNpAXRUCJLNimVl0jpEwolDOwWnCjXAEQBauf4I8bFZVBALfkpQZ34TFf3mOm9HiCtywpIS5q67/vlmXLW+lz3IZx8t0A7oNLUPlIviLpMEI99aXzXNd9APyy25P0JI8BiUdGfs7X/84mDdvV72jXT2w9fFaARUCQFUlTOPfO8C+4Y/eaVlTRe5Osa2L/ZAMCz/qz3SdS5Aj5puVlVTcRUGz8QefffoEoobj5xhNe4dm/2UKVMdfwvuDZ6CBzydLXDBElEwu7l++ypv98qM26oMAA4Mhv0MIiJPAUZClC7c6JwzSEM7DaL3dl6XVxEioHNZvK+Gw6y+rvIthEUfiaaJuphhgAAy/dqXYBp1dGT/cqZQvbfIalRq/aB2HA8Ve7l+HYAJ5bvm8MXAqB2o7dQUiqDybQgJgxXIw9624r33bIchYIHlBi51CFWgiXv1ag9kzZom9HZw7YRSfytF7dtehLZEUY+f+IKMO2P8MS2Dz7JUvtbBHUt1BSLhKrXoL1zMowubJgxY+9+TQESXDTTeBUAE8EjIBoGlPDSHsKJfr20jBRKlvwuUgVIWzBcUTUBEhNckmrsABiFQX/+pbe1K8xb4WJMmy8UbA3HU4dOSUr3A6QnZPA4LCIPeIB0OUrf5lppFBwYUF21FAxxEIT9BAD5Ac8A8Ei7fZMa+wZIrNO5IQvZEKT8wBOFa8dTSOcEDB5zwbo55ae3f2SU4R+ECdOSrt5+gUsA1dUrsl9eBlCK/nrLv4UgQzQj6qgqGAb+uw3Vxq/LtXs3p1GDv0PM9Y5pPakWEQ3aOkZN3/nNNEYluEDA0BnYAhlOpryV6oOpvZ/A0fewaJzuNcO171Fc0pmotYiYEAo6tylAAZ9H4lscpgo4IGjy3Bn6zC/qEUp/bQRY32vvc0/9HJI8CxMQpnsoRCpQpksAwJ5yaa79RaYzNAUhqG7rCmNhRJ5cjdV+76bbAjy67ygEOHB8b3++VCmXY2CAsXvBtjjHehZ48zmn0i9H+xJDyVNgezrIKaCAglQ8ROms8zdtCqhz6O5zy4j+WTgIoZJ2ilQdMt02qO7/L8mODZ/Dr/FlhrZ+QTJLbtTqZANYVpAllqTaKbU3W/X+FA1siJkaSCQOhOiN4eVbLlO2bVBJWgIVQ5g9PKadgwHgwZYzrBSKOmUgo4KgngaYlFnAECLb+BwVDsAAiAOKutrD2sT/nNp+xd8hp9xsStV7NJ2Xb7241tFzmVTGK0a1BlKFsKafL4CSYyUBCSljTMhOQoUY1AZSBpGIaAUyu1w1AKlCRUBc/50xpM55sitVPKapd0SkHiCKEtVl1nFwFkwAuMTX6WEAyGhSRmLb1oHb17XChgqtgzSHcwRaYUZtRRw1zQ4otYC58XDxoLAHKI+/AODv6pEwFeDuAQbyUiPzO972flwjwNeVofUZ1FzftDtvtl9nFAitP68bHbROcqBZXIEESCqYDiQEhQhsG4vUVlkHc4aSAVCb9SAGXFmVTLoJlVkNANL5BTj3pdq4rWWR0403BzIWpPN21oxq2SUTTuOKQ7OnrU1ETlsEcxgxY7Yc514hpfQbaQHshWcyvepbIYIjXmkZumzu8kKhxNTUysXgRFKL2tEcakiwAAfz3S5qLNBocNXdwJE+bx7s/cgLbJX0XFLXVjs7lcHmHIjMsq3X6/U6SUUVBBEQ+DesB5+UMr5TZspC7p7/lerL6l/dLFogs6PE7Ob8WEmRoxkLoHmW3KJVejTa2fpIFkDYg5dZUlmJoMPCxAv8pMOpp9TqcBp7nBHoqMkjb/pTX8VcTlQW9vZm/ogYZNsMDmOLtZokHbYHTaParL+d5zEzPloBEwK+dqo1KttQPdQBeI9GS5s4DetzgQd1X80ALFFNgZJ3MgUgrmuWM6QOIhDSMhgJRFmIysS2BhWxTL9Z5Y68eid1J31cBkUARcnoZkCfUJAhUVV4A1UCE7FSO4RZiVnAQf0tGQq5kxjdIhJKKydHlQ6TYd3FKTeUxBpW96KNd17xkWNdeXyM9/Vs2PZUVZA/evuR+r5maBMRgCjBveOFDU++mq7QA7DIjpgUaVlofXQ0Zdqsz1y+mgH4RJKe1B4Wq7wmJER96M89g+WrGS/tkUUrLectAQeA5fvVYtUeBVYj/QJeHnVuqS/r4OOC11CngdCVw8cJzM6ZXngU8w455frZuFZ04MgeoH+3WbACLV9d3+9+YNUetcfe48gf+/YNE+YRIS9Q4xYVQC3imBkWtmPtPatNpvM042uGFaGwDb338ICJvTd1xuxhKzYmBEnp/srOD+2bxeX7FbnSNUfZ28+UsOcSuGoCJQILNfkGSOnUJrASgZK6oicMX42DdsdTY8/YBOYPK6b7ekipTgchoEFmsy2Pata+CqjAh50IJ579IICt6SFDLApP5lVLlRtrprZ3uPZld6A2CRDXS8D6buupmAMQt9bO4gFuhzWlr1lW+6DWSh9RnwioNl8dNBu+8Ao2nFLBXtVrsc43TX+gc4hLTl3VA2obLnZ2LT2zYWmUdJIN0f02MuWHYo+qsmlPM8sFOxgLPsYCWYhAr5PKUYWmba2OuNAR45cSg8i7Ukbcwzy2/eonSf0e2La6fR5dHnRsi/avo7rbHG1MUrURDPxPD+3a+CwToMTmZ0i7TzLfjgF1019wgDoSPiZrOuLZCvKvbjAiVSiae2r58vO66RQw+idq2LxV+bYXuUohNGciEXSYGbW/ikXUCS0fbHv1gZBFR3jaEHVZAHbWHoGkPGf0Jk1gWb6dNJShy43ujokrSkEb1OkMYiWYTG2ioCQvNdMZhrBUDZM+XM+pBcVfrSSmsWZW+kdbPnCL+JoHhKFEUFViXuE5/IA2+kQNhIStoXhqqic59GAFgEUuxwfy17/AQ8P/iCB8GxInaEmEKGizYa38N+UdG7bM9n/NJslRJuPKTPOpEuNVCuz1NVdGNj4E4KHZv46G7rnKBz0fQFzyLV5HYEPmJP7Ri4WP7UdO2WL3ACvyEkmyrUJ88Sx+EYskqLH903M23vmNRye7a+gbVTx6dvpnR2pBHnMeKAs05EWKQ7kcpz0XAOf8gjDaR0u7JqKxarhZfZLyYWaA5kTWuXsdAOzezYxi2oXvpOSvqTY5AQqYVLUOoTF8zUvYffozZc6iMBjj0X2K4hqH4hp3QlDd8nlp7ufRsxWFwXiqHKyVsHslfM23nFKom+/k+JJ4/G8AAMUBzyl1f8S8tPOaF436HWwjUiLfAjSS+lhjbt+8ZP3W7pSEqCcgT0YJAwOydOOdXZ7sZ9Ul07Egrfo82XZY8rv23XfDwQbZKpXuqj0KAJFWvkyumgA2PUNbd0vkYpGw+/SS959FPi8penGCXf27DfIkU+XwMz6zZCWkKk1sg0ShAVNSSiLCn7fKjJtqnB0xpV3XPGK1fB+FESt4+jwtMYsr+8R2/Kee7B3nt8wXWNycRNHy1FcLjanDbMU1rnvtnb+d2I5PaVzyAPOMmBlmmKW2a3L4ykcbE0tmokersqoAWbF58mVHM4/kE7wjodBOBV1bVmVznSjs0fRwzq/6lWMUsnLW+q3dZe4cFuYQ6dHZ6dQFlk1SrrWbSh5QSs8kz4bf0jO1XNq5bk+YxP8dYZuZzsYVIGL4ipewc/Vj9uwthLykB05ea3+ox+f3+geYQPpLT1t82Hk2kpqbPnAIQOERtbP1pa9MbLvmcWQL3HoOeqYGFbKCnPJpRv+Ya5NPw2RMSutqyIiMxiXnM72XhUNbNqO4xh2TP9TXBZKQItHFNa597ZYv+UzfezUu1QlEzapXYCNja2OP91rOp2h3Vo4AAJNib4EeH75yInK1D6cjcjCL00FWa1MuCZfkMkNbb0JxjcP5twVHpYks9NppXV3zsiOM4hqXGdp6Uznq+5QkZTezTFcFszAzhVq9/sVtHyxhb+Ew4PhwH5YOW7CVkQ3fDOLJv0TUbRvMrNQxpLQKcRUfR0tuDi/fehMevjZpJqWve5eXrpEKgz4ztPVzcdR3s7qqh3o7I0gpOQo7bFAb+6/lHRv/dr5jvXMDI8UBr9kR8+au0Rv/adJeKFHHRYhLHkRGG91wBUtc8i7qvTkaGl725l/89o0P5x9OXtcn1/sfsMivcauyCJ8Itt0ah70bJak4qJgWZh+g4jTqDmzl4APVnRtupFR4MnfpOQ/Gg1V79OHbr02WuAPvZ1d9AiY0quRnOjI14qo+zvR+/Cfnfvr/njR015tQXJN2xl5RbaSj17p6qtKT/cqZj4Xn3l+L+jZKXHZQsdPgCUHhPYI2a5LJp3r9+DqCNnI+PTporp4b7i8MvrD0sq/8x/G2k3/gjO2Fr9XP0jYPM5nUJ7a9bSzBj9qH7vlkJU93ayO/WrVHX7OSL5dj7F1NyA96AhAN3bt2itu+4m20DE3GaeOdMKDew7Yb4ysvtLn979pfuOEF5K474umsI8+NKQx69OfswW989Od9g3dfOhF1f8vbTCe5mm8OQEwFaRGXvSPbJ+HSu+z6kQ+0+4nPju8c/HEzUQVaes4W03yVRUb49hao+bx86rN61t3+lhL13hyb6N3iHZCU/QzhASBJvNp2Y6V2sMePvefgrht+kSbM5I8ZHE79YTo3ZXRk8Pt9l9/2rkm7tOBt26nqKm6ao1fvJ4hTSRKRsPPdU2TeGa7feU8H4atj2wZ/pk0HnrMq3qbze3QRzZkM+nMWI1kPSulOvevu+tclav/EJHi92LYAcUnqgMqs1Euchl3WuOrTnX7/ew7uvO4nC50FsTA/VdfE0V3X/n1f6blL2Mc/R9hpoerQJNeiTlMxhuKS9+LDJOjaNKH24WD99uGO9Xe/47S9ExGKeWdVJukwxtTx5TTGJZMo5t2qwcGgY92Wdwbrt28bp86H46DzD0QpoHjKg4inp8xRvcpQh7DLWl/e0xE//Y6xndf9pD4fcUEtn4UPYCzmHfpzdv99H/uXU9/71bft71ixzUVd/17jkqLRga7vR0EGUNV4QjxM6MPudc7X1lWjf/tYZujubRXVMlIqGB2LvumsnE4JcKF5R7T23iseNeH71YSrhQMgriAdzwdW4tla5wFiCrusScbvOzned/WzhU8eqmvegrOIo5tgWeee7MvTQQXe3ZbOofpjZWM1qToQWidHUhpsVBFPiUAZpv1NEnXmYx9DvAdBaVGIsR6ohl23giKoJoCrCRBrnac3S3CavnDbZo14MfHEHyXbhz7/LID6yYCjajYefaqRJ6mnMKgOr//TjtroJVaShyjqsiBLAFw6WLGVtEwGYIKrisYlJykvcO55inz0S1ICNElEk0mXCg8NwbUSqBUQBw6Iwi4buOpDbfH4JfH2tZ/XxjDdPB11tnCMuRql5MvsiJksfOgHFz3ztYui2sQfGeJDFHZacEAEcTR7xl1jMCwaI+4WKwJrYyqlPWxPCgHUERmiqMcy/IEoHv30Rc/dctHUyFXfn4amjo3bc3zJbmHQIztiisWiq+4Y+rPltf2/FbiJrxroOIVdVjmixgxVQF/Nfq82n2sCpqjTsrqxMJ74Qm/t4Fuq26/4YrFYdIsxden4B3GnCyBkR/j5wuDTAD7ac/mtf15G3x+SYoMEHScrNB3Grc4DnFJojzEM62E9pfTwCSm0QeFRNgY2Y1gU5OOnOJnc2ZmM3zpauPbpGtAY+eQXY+qSXbQ33hhsPVjg8V2DTwH4zGnZO754QONLHQdDCnOxhJ0dCgJ8nB4MEJFp3lIdi5YFuCEiac79UyYQsdqAYEOQCjiZmuJa+XsWbviNbvSv9xaunxpt1MLFAY8iLVqtvrj/jCA9huAbJdSzhcFDAO4l4N7eK7esrCRujQC/68EXqOjpGrRllOrzXiVJ2Q9HxAqFAErJiRzVZ1l6kHcV9pUn2Jd+bDn4TuTKD4zu2viMA7B3Rkm5+CCHfUU8ULN2TP9BgQ5sltE8PQ1gC4At2Wwu/C6dfvYU+dUssjrh4DyCfwNJ9G8MtxxqPDxfcUZ9DB//g/r4xUCrjxDxzyy5n/6H+FuPFgoFHwMoN1KS3ZsZxc0eBXrFZj38f5R4h3SqusohAAAAAElFTkSuQmCC';

// =====================================================
// EMPLOYEE DATABASE & APP STATE
// =====================================================
const EMPLOYEES = [
  // OFFICE (17 staff)
  {code:'MD001',name:'Selvam',dept:'Office',designation:'Managing Director',salary:200000,bank:'UOB',accNo:'2524***1001',role:'MD',phone:'9840000001',doj:'2015-01-01',email:'selvam@swethastructures.com'},
  {code:'SSC001',name:'Lakshmi Priya',dept:'Office',designation:'Accounts Manager',salary:45000,bank:'UOB',accNo:'2524***1002',role:'Employee',phone:'9840000002',doj:'2019-03-15',email:'lakshmi.priya@swethastructures.com'},
  {code:'SSC002',name:'Ramesh Kumar',dept:'Office',designation:'Office Manager',salary:40000,bank:'UOB',accNo:'2524***1003',role:'Employee',phone:'9840000003',doj:'2018-07-10',email:'ramesh.kumar@swethastructures.com'},
  {code:'SSC003',name:'N.Hari Haran',dept:'Site',designation:'Site Supervisor',salary:50000,bank:'UOB',accNo:'2524***1004',role:'Employee',phone:'9840000004',doj:'2017-06-01',email:'hari.haran@swethastructures.com'},
  {code:'SSC004',name:'Govindan',dept:'Office',designation:'Clerk',salary:25000,bank:'UOB',accNo:'2524***1005',role:'Employee',phone:'9840000005',doj:'2020-01-20',email:'govindan@swethastructures.com'},
  {code:'SSC005',name:'Anitha Devi',dept:'Office',designation:'Receptionist',salary:22000,bank:'UOB',accNo:'2524***1006',role:'Employee',phone:'9840000006',doj:'2021-04-12',email:'anitha.devi@swethastructures.com'},
  {code:'SSC006',name:'Priyanka',dept:'Office',designation:'HR Manager',salary:55000,bank:'UOB',accNo:'2524***1007',role:'HR',phone:'9840000007',doj:'2019-08-01',email:'priyanka@swethastructures.com'},
  {code:'SSC007',name:'Dinesh Babu',dept:'Office',designation:'Accountant',salary:35000,bank:'UOB',accNo:'2524***1008',role:'Employee',phone:'9840000008',doj:'2020-06-15',email:'dinesh.babu@swethastructures.com'},
  {code:'SSC008',name:'Karthik Rajan',dept:'Office',designation:'Billing Executive',salary:28000,bank:'UOB',accNo:'2524***1009',role:'Employee',phone:'9840000009',doj:'2021-02-28',email:'karthik.rajan@swethastructures.com'},
  {code:'SSC009',name:'Sankar Guru.P',dept:'Office',designation:'Senior Architect',salary:45161,bank:'UOB',accNo:'2524***1010',role:'Employee',phone:'9840000010',doj:'2017-11-01',email:'sankar.guru@swethastructures.com'},
  {code:'SSC010',name:'Vellaisamy Sankar',dept:'Site',designation:'Foreman',salary:43548,bank:'UOB',accNo:'2524***1011',role:'Employee',phone:'9840000011',doj:'2018-03-20',email:'vellaisamy.sankar@swethastructures.com'},
  {code:'SSC011',name:'Vishnu Kumar',dept:'Office',designation:'Office Staff',salary:100000,bank:'UOB',accNo:'2524***2932',role:'Employee',phone:'9840000012',doj:'2019-05-01',email:'vishnu.kumar@swethastructures.com'},
  {code:'SSC012',name:'Murugan.S',dept:'Office',designation:'Peon',salary:18000,bank:'UOB',accNo:'2524***1013',role:'Employee',phone:'9840000013',doj:'2020-09-10',email:'murugan.s@swethastructures.com'},
  {code:'SSC013',name:'Jayalakshmi',dept:'Office',designation:'Store Keeper',salary:24000,bank:'UOB',accNo:'2524***1014',role:'Employee',phone:'9840000014',doj:'2021-01-05',email:'jayalakshmi@swethastructures.com'},
  {code:'SSC014',name:'Raghavan.T',dept:'Office',designation:'Driver',salary:22000,bank:'UOB',accNo:'2524***1015',role:'Employee',phone:'9840000015',doj:'2019-12-01',email:'raghavan.t@swethastructures.com'},
  {code:'SSC015',name:'Kavitha.R',dept:'Office',designation:'Data Entry',salary:20000,bank:'UOB',accNo:'2524***1016',role:'Employee',phone:'9840000016',doj:'2022-03-15',email:'kavitha.r@swethastructures.com'},
  {code:'SSC016',name:'Suresh.M',dept:'Office',designation:'Office Assistant',salary:18000,bank:'UOB',accNo:'2524***1017',role:'Employee',phone:'9840000017',doj:'2022-07-01',email:'suresh.m@swethastructures.com'},
  {code:'SSC023',name:'Praveen',dept:'Office',designation:'Senior Staff',salary:47581,bank:'UOB',accNo:'2524***1018',role:'Employee',phone:'9840000018',doj:'2018-05-20',email:'praveen@swethastructures.com'},
  // SITE (15 staff)
  {code:'SSC017',name:'Nithya Prabhu',dept:'Site',designation:'Site Engineer',salary:38000,bank:'SBI',accNo:'3847***2001',role:'Employee',phone:'9840000019',doj:'2019-09-01',email:'nithya.prabhu@swethastructures.com'},
  {code:'SSC018',name:'Arun Prasad',dept:'Site',designation:'Mason Head',salary:35000,bank:'SBI',accNo:'3847***2002',role:'Employee',phone:'9840000020',doj:'2018-11-15',email:'arun.prasad@swethastructures.com'},
  {code:'SSC019',name:'Bala Kumar',dept:'Site',designation:'Site Supervisor',salary:32000,bank:'SBI',accNo:'3847***2003',role:'Employee',phone:'9840000021',doj:'2020-02-01',email:'bala.kumar@swethastructures.com'},
  {code:'SSC020',name:'Dhanush.R',dept:'Site',designation:'Helper',salary:20000,bank:'SBI',accNo:'3847***2004',role:'Employee',phone:'9840000022',doj:'2021-06-20',email:'dhanush.r@swethastructures.com'},
  {code:'SSC021',name:'Ezhilarasan',dept:'Site',designation:'Electrician',salary:28000,bank:'SBI',accNo:'3847***2005',role:'Employee',phone:'9840000023',doj:'2020-04-10',email:'ezhilarasan@swethastructures.com'},
  {code:'SSC022',name:'Balasubramaninam',dept:'Site',designation:'Labour Head',salary:30000,bank:'SBI',accNo:'3847***2006',role:'Employee',phone:'9840000024',doj:'2017-08-15',email:'balasubramaninam@swethastructures.com'},
  {code:'SSC024',name:'Ganesh Kumar',dept:'Site',designation:'Plumber',salary:25000,bank:'SBI',accNo:'3847***2007',role:'Employee',phone:'9840000025',doj:'2021-03-01',email:'ganesh.kumar@swethastructures.com'},
  {code:'SSC025',name:'Harish.V',dept:'Site',designation:'Carpenter',salary:27000,bank:'SBI',accNo:'3847***2008',role:'Employee',phone:'9840000026',doj:'2020-10-15',email:'harish.v@swethastructures.com'},
  {code:'SSC026',name:'Ilango.P',dept:'Site',designation:'Welder',salary:26000,bank:'SBI',accNo:'3847***2009',role:'Employee',phone:'9840000027',doj:'2021-09-01',email:'ilango.p@swethastructures.com'},
  {code:'SSC027',name:'Jeeva Rajan',dept:'Site',designation:'Helper',salary:18000,bank:'SBI',accNo:'3847***2010',role:'Employee',phone:'9840000028',doj:'2022-01-10',email:'jeeva.rajan@swethastructures.com'},
  {code:'SSC028',name:'Karthik.S',dept:'Site',designation:'Site Worker',salary:20000,bank:'SBI',accNo:'3847***2011',role:'Employee',phone:'9840000029',doj:'2022-05-01',email:'karthik.s@swethastructures.com'},
  {code:'SSC029',name:'Loganathan',dept:'Site',designation:'Painter',salary:24000,bank:'SBI',accNo:'3847***2012',role:'Employee',phone:'9840000030',doj:'2021-11-15',email:'loganathan@swethastructures.com'},
  {code:'SSC030',name:'Manikandan.R',dept:'Site',designation:'Helper',salary:18000,bank:'SBI',accNo:'3847***2013',role:'Employee',phone:'9840000031',doj:'2022-08-01',email:'manikandan.r@swethastructures.com'},
  // FACTORY (14 staff - incl PEB)
  {code:'SSM001',name:'Shanmugam.G',dept:'Factory',designation:'Factory Supervisor',salary:38000,bank:'UOB',accNo:'2524***3001',role:'Employee',phone:'9840000032',doj:'2018-01-10',email:'shanmugam.g@swethastructures.com'},
  {code:'SSM002',name:'Govarthanan',dept:'Factory',designation:'Welder',salary:30000,bank:'UOB',accNo:'2524***3002',role:'Employee',phone:'9840000033',doj:'2019-04-15',email:'govarthanan@swethastructures.com'},
  {code:'SSM003',name:'Krishna Gowri Sankar.S',dept:'Factory',designation:'Senior Fabricator',salary:41829,bank:'UOB',accNo:'2524***3003',role:'Employee',phone:'9840000034',doj:'2017-09-01',email:'krishna.gowri@swethastructures.com'},
  {code:'SSM004',name:'Karthikeyan',dept:'Factory',designation:'Machine Operator',salary:28000,bank:'UOB',accNo:'2524***3004',role:'Employee',phone:'9840000035',doj:'2020-07-20',email:'karthikeyan@swethastructures.com'},
  {code:'SSM005',name:'Vijaya Kumar',dept:'Factory',designation:'Welder',salary:25000,bank:'UOB',accNo:'2524***3005',role:'Employee',phone:'9840000036',doj:'2019-11-01',email:'vijaya.kumar@swethastructures.com'},
  {code:'SSM006',name:'Sakthi Kumar.S',dept:'Factory',designation:'Helper',salary:36129,bank:'UOB',accNo:'2524***3006',role:'Employee',phone:'9840000037',doj:'2020-03-10',email:'sakthi.kumar@swethastructures.com'},
  {code:'SSM007',name:'Lingeswaran',dept:'Factory',designation:'Fabricator',salary:26000,bank:'UOB',accNo:'2524***3007',role:'Employee',phone:'9840000038',doj:'2021-01-15',email:'lingeswaran@swethastructures.com'},
  {code:'SSM008',name:'Udhaya Shankar',dept:'Factory',designation:'Helper',salary:22000,bank:'UOB',accNo:'2524***3008',role:'Employee',phone:'9840000039',doj:'2021-08-01',email:'udhaya.shankar@swethastructures.com'},
  {code:'SSM009',name:'Raj Kumar.P',dept:'Factory',designation:'Painter',salary:24000,bank:'UOB',accNo:'2524***3009',role:'Employee',phone:'9840000040',doj:'2022-02-10',email:'raj.kumar@swethastructures.com'},
  {code:'SSM010',name:'Saravanan.K',dept:'Factory',designation:'Quality Check',salary:30000,bank:'UOB',accNo:'2524***3010',role:'Employee',phone:'9840000041',doj:'2020-09-15',email:'saravanan.k@swethastructures.com'},
  // PEB
  {code:'SSM011',name:'Manikandan (PEB)',dept:'PEB',designation:'PEB Supervisor',salary:20323,bank:'UOB',accNo:'2524***4001',role:'Employee',phone:'9840000042',doj:'2019-06-01',email:'manikandan.peb@swethastructures.com'},
  {code:'SSM012',name:'Prakash.T',dept:'PEB',designation:'PEB Worker',salary:18000,bank:'UOB',accNo:'2524***4002',role:'Employee',phone:'9840000043',doj:'2020-12-01',email:'prakash.t@swethastructures.com'},
  {code:'SSM013',name:'Senthil.R',dept:'PEB',designation:'PEB Fabricator',salary:22000,bank:'UOB',accNo:'2524***4003',role:'Employee',phone:'9840000044',doj:'2021-05-15',email:'senthil.r@swethastructures.com'},
  {code:'SSM014',name:'Vignesh.M',dept:'PEB',designation:'PEB Helper',salary:16000,bank:'UOB',accNo:'2524***4004',role:'Employee',phone:'9840000045',doj:'2022-04-01',email:'vignesh.m@swethastructures.com'},
  // GARDEN (5)
  {code:'SSG001',name:'Ramu',dept:'Garden',designation:'Gardener',salary:12000,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000046',doj:'2018-06-01',email:'ramu@swethastructures.com'},
  {code:'SSG002',name:'Selvi',dept:'Garden',designation:'Gardener',salary:10000,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000047',doj:'2019-02-15',email:'selvi@swethastructures.com'},
  {code:'SSG003',name:'Kumar.G',dept:'Garden',designation:'Security',salary:15000,bank:'SBI',accNo:'3847***5001',role:'Employee',phone:'9840000048',doj:'2017-12-01',email:'kumar.g@swethastructures.com'},
  {code:'SSG004',name:'Lakshman',dept:'Garden',designation:'Security Night',salary:14000,bank:'SBI',accNo:'3847***5002',role:'Employee',phone:'9840000049',doj:'2020-05-10',email:'lakshman@swethastructures.com'},
  {code:'SSG005',name:'Devi.M',dept:'Garden',designation:'Cleaner',salary:8250,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000050',doj:'2021-10-01',email:'devi.m@swethastructures.com'}
];

let departments = ['Office','Site','Factory','Garden','PEB'];
let currentUser = null;
let wizardStep = 1;
let originalSalaryHTML = '';
let leaveApplications = [];
let leaveBalances = {};
let selectedLeaveType = 'casual';
let NOTIF_HISTORY = [];
let notifPrefs = { salary: true, leave: true, advance: true, payroll: true, expense: true, exit: true, celebration: true, compliance: true, announcement: true, asset: true };
let leaveNextId = 1;

// =====================================================
// F11: DOB MAP (month/day for all 46 employees)
// =====================================================
const EMP_DOB_MAP = {
  'MD001':'1975-03-11','SSC001':'1990-06-15','SSC002':'1988-11-22','SSC003':'1985-07-04','SSC004':'1992-01-18',
  'SSC005':'1994-09-30','SSC006':'1991-04-25','SSC007':'1993-12-08','SSC008':'1995-02-14','SSC009':'1986-08-19',
  'SSC010':'1984-05-07','SSC011':'1989-10-03','SSC012':'1996-03-11','SSC013':'1993-07-27','SSC014':'1987-11-15',
  'SSC015':'1995-06-22','SSC016':'1997-01-09','SSC023':'1988-04-14','SSC017':'1991-09-01','SSC018':'1986-12-25',
  'SSC019':'1992-03-17','SSC020':'1998-08-05','SSC021':'1990-02-28','SSC022':'1983-10-12','SSC024':'1994-05-20',
  'SSC025':'1993-07-08','SSC026':'1995-11-30','SSC027':'1999-04-02','SSC028':'1997-06-18','SSC029':'1994-01-25',
  'SSC030':'1998-09-14','SSM001':'1985-03-28','SSM002':'1990-12-10','SSM003':'1984-06-03','SSM004':'1992-08-22',
  'SSM005':'1991-11-07','SSM006':'1993-04-19','SSM007':'1996-02-11','SSM008':'1997-07-30','SSM009':'1995-10-16',
  'SSM010':'1992-05-24','SSM011':'1988-01-31','SSM012':'1994-08-13','SSM013':'1996-06-09','SSM014':'1998-03-22',
  'SSG001':'1980-07-15','SSG002':'1982-12-20','SSG003':'1979-09-05','SSG004':'1985-04-11','SSG005':'1990-02-18'
};
EMPLOYEES.forEach(e => { if (EMP_DOB_MAP[e.code]) e.dob = EMP_DOB_MAP[e.code]; });

// =====================================================
// NEW FEATURE DATA STRUCTURES
// =====================================================

// F1: Shift Management
const SHIFT_TYPES = [
  {code:'GEN', name:'General Shift', time:'09:00 - 18:00', color:'#2563EB'},
  {code:'2ND', name:'Second Shift', time:'14:00 - 22:00', color:'#D97706'},
  {code:'3RD', name:'Third Shift (Night)', time:'22:00 - 06:00', color:'#7C3AED'}
];
let shiftAssignments = {};
const SHIFT_ELIGIBLE_DEPTS = ['Factory'];

// F2: Expense Reimbursement
const EXPENSE_CATEGORIES = ['Travel','Food','Accommodation','Equipment','Office Supplies','Medical','Fuel','Other'];
let expenseReimbursements = [];
let expReimbNextId = 1;

// F3: Self Service
let employeeSelfData = {};

// F4: Geo-fenced Attendance
const SITE_LOCATIONS = [
  {name:'Head Office - Saravanampatti', lat:11.0850, lng:76.9960, radius:200},
  {name:'Factory - Sulur', lat:11.0378, lng:77.1260, radius:300},
  {name:'Site - Porur', lat:11.0320, lng:76.9800, radius:250},
  {name:'PEB Unit - Kinathukadavu', lat:10.8100, lng:76.9700, radius:250}
];

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

// F9: Org Chart
const REPORTING_MAP = {
  'MD001': { reports: ['SSC006','SSC001','SSC002','SSC009','SSC023'] },
  'SSC006': { reports: ['SSC005','SSC015','SSC016'] },
  'SSC001': { reports: ['SSC007','SSC008','SSC004'] },
  'SSC002': { reports: ['SSC012','SSC014','SSC013'] },
  'SSC003': { reports: ['SSC017','SSC019','SSC010'] },
  'SSC009': { reports: ['SSC003','SSM001'] },
  'SSC017': { reports: ['SSC018','SSC020','SSC021','SSC024','SSC025','SSC026','SSC027','SSC028','SSC029','SSC030','SSC022'] },
  'SSM001': { reports: ['SSM002','SSM003','SSM004','SSM005','SSM006','SSM007','SSM008','SSM009','SSM010','SSM011'] },
  'SSM011': { reports: ['SSM012','SSM013','SSM014'] },
  'SSC023': { reports: ['SSC011'] },
  'SSG003': { reports: ['SSG001','SSG002','SSG004','SSG005'] }
};

// F10: Announcements
const ANNOUNCE_CATEGORIES = ['General','Policy Update','Event','Achievement'];
let announcements = [
  {id:1, title:'Pongal Holiday Schedule 2026', body:'Office will remain closed from Jan 14-16. Factory skeleton staff on Jan 15.', category:'Event', author:'MD001', date:'2026-01-10', priority:'high'},
  {id:2, title:'New Safety Guidelines', body:'All site and factory employees must wear safety helmets at all times. Violations will be reported.', category:'Policy Update', author:'SSC006', date:'2026-02-20', priority:'normal'},
  {id:3, title:'Employee of the Month - February', body:'Congratulations to Krishna Gowri Sankar for outstanding fabrication work on the Porur project!', category:'Achievement', author:'MD001', date:'2026-03-01', priority:'normal'}
];
let announcementNextId = 4;
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
// Pre-computed SHA-256 hashes for demo passwords
const CREDENTIAL_HASHES = {
  'MD001': {hash:'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', idx:0},   // admin123
  'SSC006': {hash:'070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf', idx:6}, // hr123
  'SSC011': {hash:'e03d3ec8d5035f8721f5dc64546e59ed790dbcb3b7b598fe57057ccd7b683b00', idx:11}  // emp123
};
const DEFAULT_HASH = 'e03d3ec8d5035f8721f5dc64546e59ed790dbcb3b7b598fe57057ccd7b683b00'; // emp123
EMPLOYEES.forEach((e,i) => { if (!CREDENTIAL_HASHES[e.code]) CREDENTIAL_HASHES[e.code] = {hash:DEFAULT_HASH, idx:i}; });

// =====================================================
// LOGIN
// =====================================================
async function doLogin() {
  const id = document.getElementById('loginId').value.trim().toUpperCase();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  if (!id) { err.textContent = 'Please enter Employee Code'; return; }

  // Try backend API login first
  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empCode: id, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      JWT_TOKEN = data.token;
      safeStorage.set('hrms_jwt', data.token);
      const empIdx = EMPLOYEES.findIndex(e => e.code === id);
      if (empIdx >= 0) { loginAs(empIdx); return; }
    }
  } catch (e) {
    // Backend login unavailable, using local auth
  }

  // Fallback to local credentials with hashed comparison
  const cred = CREDENTIAL_HASHES[id];
  if (!cred) { err.textContent = 'Invalid credentials. Try demo buttons below.'; return; }
  const inputHash = await sha256(pass);
  if (cred.hash !== inputHash) { err.textContent = 'Invalid credentials. Try demo buttons below.'; return; }
  loginAs(cred.idx);
}
function demoLogin(type) {
  const demoPasswords = {MD:'admin123', HR:'hr123', EMP:'emp123'};
  const demoCodes = {MD:'MD001', HR:'SSC006', EMP:'SSC011'};
  document.getElementById('loginId').value = demoCodes[type] || 'SSC011';
  document.getElementById('loginPass').value = demoPasswords[type] || 'emp123';
  doLogin();
}
function loginAs(empIndex) {
  currentUser = {...EMPLOYEES[empIndex]};
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appHeader').style.display = '';
  document.getElementById('appContent').style.display = '';
  document.getElementById('bottomTabs').style.display = '';
  applyRole();
  updateGreeting();
  buildCalendar();
  initLeaveTabs();
  // Set initial history state so back button has a baseline
  history.replaceState({ tab: 'home' }, '');
}
function doLogout() {
  currentUser = null;
  JWT_TOKEN = null;
  safeStorage.remove('hrms_jwt');
  // Clean up idle timer
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
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
  document.querySelectorAll('.overlay-screen.active').forEach(function(o) { o.classList.remove('active'); });
  _overlayPreviousFocus = [];
  // Reset to home tab without pushing history
  switchTab('home', document.querySelector('[data-tab=home]'), true);
  // Clear all navigation history
  history.replaceState(null, '');
}

// =====================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================
function applyRole() {
  const role = currentUser.role;
  const isMD = role === 'MD';
  const isHR = role === 'HR';
  const isMDorHR = isMD || isHR;

  // Role badge
  const badge = document.getElementById('roleBadge');
  badge.textContent = role;
  badge.className = 'role-badge ' + role.toLowerCase();

  // Header avatar
  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('headerAvatar').textContent = initials;

  // Admin button (MD only)
  document.getElementById('adminBtn').style.display = isMD ? '' : 'none';
  // Settings button (hide for MD since they have admin)
  document.getElementById('settingsBtn').style.display = isMD ? 'none' : '';

  // Show/hide MD/HR-only elements
  document.querySelectorAll('.md-hr-only').forEach(el => {
    el.classList.toggle('hidden', !isMDorHR);
  });

  // Show/hide MD-only elements (location tracker etc.)
  document.querySelectorAll('.md-only').forEach(el => {
    el.classList.toggle('hidden', !isMD);
  });
  document.getElementById('locationBtn').style.display = isMD ? '' : 'none';

  // Greeting
  document.getElementById('greetingName').innerHTML = escapeHTML(currentUser.name) + ' <span class="wave">&#128075;</span>';

  // Profile overlay
  updateProfileOverlay();

  // Salary screen — role-based content
  updateSalaryScreen();

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
  const rng = seededRandom(emp.code + monthIdx + year);
  const variation = 0.95 + rng() * 0.10; // ±5%
  const gross = Math.round(emp.salary * variation);
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
  const workedDays = Math.max(daysInMonth - Math.floor(rng() * 3), daysInMonth - 2);
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
const FY_MONTHS = [
  {m:'Apr',mi:3,y:2025},{m:'May',mi:4,y:2025},{m:'Jun',mi:5,y:2025},{m:'Jul',mi:6,y:2025},
  {m:'Aug',mi:7,y:2025},{m:'Sep',mi:8,y:2025},{m:'Oct',mi:9,y:2025},{m:'Nov',mi:10,y:2025},
  {m:'Dec',mi:11,y:2025},{m:'Jan',mi:0,y:2026},{m:'Feb',mi:1,y:2026},{m:'Mar',mi:2,y:2026}
];

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
function switchTab(id, el, _fromPopstate) {
  // Close all open overlays first — track if any were open
  var hadOverlays = document.querySelectorAll('.overlay-screen.active').length > 0;
  document.querySelectorAll('.overlay-screen.active').forEach(o => o.classList.remove('active'));
  document.querySelectorAll('.leave-form-overlay.active').forEach(o => o.classList.remove('active'));

  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + id);
  if (current && current !== next) {
    current.classList.add('fade-out');
    setTimeout(() => {
      current.classList.remove('active', 'fade-out');
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      next.classList.add('active');
      if(el) el.classList.add('active');
      document.querySelector('.app-content').scrollTop = 0;
    }, 150);
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    next.classList.add('active');
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
  if (id === 'advance' || id === 'site' || id === 'ta') { renderAllMyRequests(); renderAllPendingBanners(); }
  if (id === 'leaves') renderLeaveScreen();
}
let _overlayPreviousFocus = [];
function showOverlay(id) {
  if (id === 'admin' && currentUser.role !== 'MD') return;
  if (id === 'location' && currentUser.role !== 'MD') return;
  if (id === 'onboarding' && currentUser.role !== 'MD' && currentUser.role !== 'HR') return;
  if (id === 'advance-requests' && currentUser.role !== 'MD' && currentUser.role !== 'HR') return;
  if (id === 'admin') renderAdminPanel();
  if (id === 'onboarding') resetWizard();
  if (id === 'notifications') renderNotifications();
  if (id === 'location') openLocationTracker();
  if (id === 'advance-requests') { advReqActiveTab = 'pending'; advReqTypeFilter = 'all'; renderAdvanceRequests('pending'); document.querySelectorAll('#advReqTabs .tab-pill').forEach((p,i) => p.classList.toggle('active', i===0)); document.querySelectorAll('#advReqTypeFilter .loc-filter-chip').forEach((c,i) => c.classList.toggle('active', i===0)); }
  // Close any currently active overlays to prevent split-screen stacking
  document.querySelectorAll('.overlay-screen.active').forEach(function(o) {
    o.classList.remove('active');
  });
  _overlayPreviousFocus.push(document.activeElement);
  const el = document.getElementById('overlay-' + id);
  el.classList.add('active');
  history.pushState({ overlay: id }, '');
  // Focus first focusable element
  const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
}
let _skipPopstate = false;
function hideOverlay(id, _fromPopstate) {
  const el = document.getElementById('overlay-' + id);
  if (el) el.classList.remove('active');
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
  const h = new Date().getHours();
  document.getElementById('timeLabel').textContent = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
setInterval(updateGreeting, 60000);

function buildCalendar() {
  const c = document.getElementById('calDays');
  c.innerHTML = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { c.innerHTML += '<div class="cal-day-label">'+d+'</div>'; });
  const att = {1:'present',2:'present',3:'present',4:'present',5:'present',6:'present',7:'present',8:'holiday',9:'present',10:'present',11:'present',12:'present',13:'half',14:'holiday',15:'holiday',16:'present',17:'present',18:'present',19:'present',20:'present',21:'holiday',22:'holiday',23:'present',24:'present',25:'absent',26:'present',27:'present',28:'holiday',29:'holiday',30:'present',31:'present'};
  for (let d = 1; d <= 31; d++) {
    const isToday = d === 7;
    const st = d <= 7 ? att[d] : '';
    const dot = st ? '<span class="cal-dot '+st+'"></span>' : '';
    c.innerHTML += '<div class="cal-day'+(isToday?' today':'')+'">'+d+dot+'</div>';
  }
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
function resetWizard() {
  wizardStep = 1;
  updateWizardUI();
  // Clear all form fields
  ['obName','obPhone','obEmail','obDob','obGender','obAddress','obAadhaar','obPan',
   'obCode','obDept','obDesignation','obSubDept','obDoj','obManager',
   'obSalary','obBank','obAccNo','obIfsc','obPayMode',
   'obEmgName','obEmgRelation','obEmgPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
  });
  // Auto-generate employee code
  const maxSSC = EMPLOYEES.filter(e=>e.code.startsWith('SSC')).length;
  document.getElementById('obCode').value = 'SSC' + String(maxSSC + 1).padStart(3,'0');
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

function submitOnboarding() {
  const name = document.getElementById('obName').value.trim();
  const code = document.getElementById('obCode').value.trim();
  const dept = document.getElementById('obDept').value;
  const designation = document.getElementById('obDesignation').value.trim();
  const salary = parseInt(document.getElementById('obSalary').value, 10) || 0;
  const bank = document.getElementById('obBank').value.trim();
  const accNo = document.getElementById('obAccNo').value.trim();
  const phone = document.getElementById('obPhone').value.trim();
  const doj = document.getElementById('obDoj').value;

  if (!name || !code || !dept || !designation || !salary) {
    showToast('Please fill all required fields (Name, Code, Dept, Designation, Salary)');
    return;
  }

  // Add to employees array
  const newEmp = {
    code, name, dept, designation, salary, bank: bank || 'TBD',
    accNo: accNo || 'TBD', role: 'Employee', phone: phone || '', doj: doj || new Date().toISOString().split('T')[0]
  };
  EMPLOYEES.push(newEmp);
  CREDENTIAL_HASHES[code] = {hash:DEFAULT_HASH, idx: EMPLOYEES.length - 1};

  showToast(name + ' added successfully as ' + dept + ' staff!');
  hideOverlay('onboarding');
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
}

function renderAdminPanel() {
  renderRolesList();
  renderDeptsList();
  renderAllEmpList();
}

function renderRolesList() {
  const container = document.getElementById('rolesList');
  const colors = ['#E85D04','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#D62828'];
  container.innerHTML = EMPLOYEES.map((e,i) => {
    const c = colors[i % colors.length];
    const init = e.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    return `<div class="emp-list-item">
      <div class="emp-avatar" style="background:${c}">${init}</div>
      <div class="emp-details"><h4>${e.name}</h4><p>${e.code} &middot; ${e.dept}</p></div>
      <select class="emp-role-select" onchange="changeRole(${i},this.value)">
        <option value="Employee"${e.role==='Employee'?' selected':''}>Employee</option>
        <option value="HR"${e.role==='HR'?' selected':''}>HR</option>
        <option value="Manager"${e.role==='Manager'?' selected':''}>Manager</option>
        <option value="MD"${e.role==='MD'?' selected':''}>MD</option>
      </select>
    </div>`;
  }).join('');
}

function changeRole(idx, newRole) {
  EMPLOYEES[idx].role = newRole;
  showToast(EMPLOYEES[idx].name + ' role changed to ' + newRole);
}

function renderDeptsList() {
  const container = document.getElementById('deptsList');
  const deptColors = {'Office':'#E85D04','Site':'#D62828','Factory':'#14B8A6','Garden':'#22C55E','PEB':'#EC4899'};
  container.innerHTML = departments.map(d => {
    const count = EMPLOYEES.filter(e => e.dept === d).length;
    const color = deptColors[d] || '#9CA3AF';
    return `<div class="dept-manage-item">
      <div class="dept-color" style="background:${color}"></div>
      <div class="dept-info"><h4>${d}</h4><p>${count} employees</p></div>
    </div>`;
  }).join('');
}

function addDepartment() {
  const input = document.getElementById('newDeptName');
  const name = input.value.trim();
  if (!name) return;
  if (departments.includes(name)) { showToast('Department already exists'); return; }
  departments.push(name);
  input.value = '';
  renderDeptsList();
  showToast('Department "' + name + '" added successfully');
}

function renderAllEmpList() {
  const container = document.getElementById('allEmpList');
  const colors = ['#E85D04','#D62828','#14B8A6','#22C55E','#EC4899'];
  let html = '';
  departments.forEach((dept, di) => {
    const emps = EMPLOYEES.filter(e => e.dept === dept);
    if (emps.length === 0) return;
    html += `<div style="margin-top:12px;margin-bottom:6px;font-family:var(--font-display);font-size:.75rem;font-weight:600;color:${colors[di % colors.length]};text-transform:uppercase;letter-spacing:.04em">${dept} (${emps.length})</div>`;
    emps.forEach(e => {
      const init = e.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
      html += `<div class="emp-list-item">
        <div class="emp-avatar" style="background:${colors[di % colors.length]}">${init}</div>
        <div class="emp-details"><h4>${e.name}</h4><p>${e.code} &middot; ${e.designation} &middot; &#8377;${e.salary.toLocaleString('en-IN')}</p></div>
        <span class="role-badge ${e.role.toLowerCase()}">${e.role}</span>
      </div>`;
    });
  });
  container.innerHTML = html;
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
  employeeLocations = EMPLOYEES.map(emp => {
    const rand = Math.random();
    let status;
    if (rand < 0.25) status = 'online';
    else if (rand < 0.40) status = 'on-site';
    else if (rand < 0.50) status = 'idle';
    else status = 'offline';

    let loc;
    if (emp.dept === 'Office' && Math.random() < 0.7) {
      loc = CHENNAI_LOCATIONS[12]; // Office - Porur HQ
    } else if (emp.dept === 'Factory' && Math.random() < 0.7) {
      loc = CHENNAI_LOCATIONS[13]; // Factory - Kundrathur
    } else {
      loc = CHENNAI_LOCATIONS[Math.floor(Math.random() * CHENNAI_LOCATIONS.length)];
    }

    const minutesAgo = status === 'offline' ? Math.floor(Math.random() * 120) + 10 : Math.floor(Math.random() * 15);
    const checkIn = (status === 'online' || status === 'on-site') ? `${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2,'0')} AM` : null;

    return {
      ...emp,
      status,
      location: {...loc, lat: loc.lat + (Math.random() - 0.5) * 0.005, lng: loc.lng + (Math.random() - 0.5) * 0.005},
      minutesAgo,
      checkIn
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
  const online = employeeLocations.filter(e => e.status === 'online').length;
  const onSite = employeeLocations.filter(e => e.status === 'on-site').length;
  const idle = employeeLocations.filter(e => e.status === 'idle').length;
  const offline = employeeLocations.filter(e => e.status === 'offline').length;

  // Summary bar
  document.getElementById('locSummary').innerHTML =
    `<div class="loc-stat"><span class="dot green"></span>${online} Online</div>` +
    `<div class="loc-stat"><span class="dot blue"></span>${onSite} On-Site</div>` +
    `<div class="loc-stat"><span class="dot orange"></span>${idle} Idle</div>` +
    `<div class="loc-stat"><span class="dot gray"></span>${offline} Offline</div>`;

  // Filter chips
  const depts = ['All', ...departments];
  document.getElementById('locFilters').innerHTML = depts.map(d =>
    `<button class="loc-filter-chip${locActiveFilter === d ? ' active' : ''}" onclick="filterLocationByDept('${escapeAttr(d)}')">${escapeHTML(d)}</button>`
  ).join('');

  // Filter employees
  let filtered = locActiveFilter === 'All' ? employeeLocations : employeeLocations.filter(e => e.dept === locActiveFilter);
  // Sort: online first, then on-site, idle, offline
  const order = {online:0, 'on-site':1, idle:2, offline:3};
  filtered.sort((a, b) => order[a.status] - order[b.status]);

  document.getElementById('locEmpCount').textContent = filtered.length + ' employee' + (filtered.length !== 1 ? 's' : '');

  // Employee cards
  document.getElementById('locEmpList').innerHTML = filtered.map(emp => {
    const init = (emp.name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const statusLabel = emp.status === 'on-site' ? 'On-Site' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1);
    return `<div class="loc-emp-card" onclick="openEmployeeOnMap('${escapeAttr(emp.name)}',${emp.location.lat},${emp.location.lng},'${escapeAttr(emp.location.area)}','${escapeAttr(emp.status)}')">
      <div class="loc-avatar" style="background:${getAvatarColor(emp.dept)}">${init}</div>
      <div class="loc-info">
        <h4>${emp.name}</h4>
        <p>${emp.designation} &middot; ${emp.dept}</p>
        <div class="loc-coords">${emp.location.area} &middot; ${emp.location.lat.toFixed(4)}&deg;N, ${emp.location.lng.toFixed(4)}&deg;E</div>
      </div>
      <div class="loc-right">
        <div class="loc-status-badge ${emp.status}"><span class="dot"></span>${statusLabel}</div>
        <div class="loc-timestamp">${emp.status === 'offline' ? getTimeSince(emp.minutesAgo) : (emp.checkIn ? 'In: ' + emp.checkIn : 'Active')}</div>
      </div>
      <div class="loc-map-link" title="Open in Google Maps"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
    </div>`;
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
  let elapsed = 0;
  if (locRefreshInterval) clearInterval(locRefreshInterval);
  locRefreshInterval = setInterval(() => {
    elapsed += 30;
    // Slightly shift a few random employees
    employeeLocations.forEach(emp => {
      if (Math.random() < 0.15) {
        emp.location.lat += (Math.random() - 0.5) * 0.002;
        emp.location.lng += (Math.random() - 0.5) * 0.002;
        emp.minutesAgo = Math.max(0, emp.minutesAgo - 1);
      }
      if (Math.random() < 0.05) {
        const statuses = ['online','on-site','idle','offline'];
        emp.status = statuses[Math.floor(Math.random() * statuses.length)];
      }
    });
    renderLocationTracker();
    document.getElementById('locLastUpdated').textContent = elapsed < 60 ? elapsed + 's ago' : Math.floor(elapsed / 60) + 'm ago';
  }, 30000);
}

function closeLocationTracker() {
  hideOverlay('location');
  if (locRefreshInterval) { clearInterval(locRefreshInterval); locRefreshInterval = null; }
}

function openEmployeeOnMap(name, lat, lng, area, status) {
  // Open Google Maps with employee location marker and traffic layer
  const url = `https://www.google.com/maps?q=${lat},${lng}&z=16&layer=traffic`;
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
  const first = active.slice(0, 10); // Google Maps supports limited waypoints
  if (first.length === 1) {
    const e = first[0];
    window.open(`https://www.google.com/maps?q=${e.location.lat},${e.location.lng}&z=12&layer=traffic`, '_blank');
  } else {
    // Use directions mode: origin = office, destination = last employee, waypoints = rest
    const origin = `${centerLat},${centerLng}`;
    const dest = `${first[first.length - 1].location.lat},${first[first.length - 1].location.lng}`;
    const waypoints = first.slice(0, -1).map(e => `${e.location.lat},${e.location.lng}`).join('|');
    window.open(`https://www.google.com/maps/dir/${origin}/${first.map(e => `${e.location.lat},${e.location.lng}`).join('/')}?layer=traffic`, '_blank');
  }
  showToast('Opening all active locations on Google Maps');
}

// Also allow clicking map dots
function renderMapDotsClickable(emps) {
  const mapArea = document.getElementById('locMapArea');
  mapArea.querySelectorAll('.loc-map-dot').forEach(d => d.remove());
  const activeLocs = emps.filter(e => e.status !== 'offline');
  const minLat = 12.88, maxLat = 13.13, minLng = 80.08, maxLng = 80.25;
  activeLocs.forEach(emp => {
    const dot = document.createElement('div');
    dot.className = 'loc-map-dot' + (emp.status === 'online' || emp.status === 'on-site' ? ' pulse' : '');
    dot.style.background = getStatusColor(emp.status);
    dot.style.cursor = 'pointer';
    const top = 100 - ((emp.location.lat - minLat) / (maxLat - minLat)) * 80 - 10;
    const left = ((emp.location.lng - minLng) / (maxLng - minLng)) * 80 + 10;
    dot.style.top = Math.max(5, Math.min(90, top)) + '%';
    dot.style.left = Math.max(5, Math.min(95, left)) + '%';
    dot.title = emp.name + ' — ' + emp.location.area + ' (Click to open on Google Maps)';
    dot.onclick = () => openEmployeeOnMap(emp.name, emp.location.lat, emp.location.lng, emp.location.area, emp.status);
    mapArea.appendChild(dot);
  });
}

// =====================================================
// UNIFIED ADVANCE APPLICATION & APPROVAL (Site / Salary / Travel)
// =====================================================
const ADV_TYPE_LABELS = {site:'Site Advance', salary:'Salary Advance', travel:'Travel Advance'};
const ADV_TYPE_ICONS = {site:'\u{1F3D7}', salary:'\u{1F4B0}', travel:'\u{1F699}'};
let advanceRequests = [
  {id:1, type:'salary', empCode:'SSC020', empName:'Dhanush.R', dept:'Site', amount:25000, reason:'Medical', details:'Hospital expenses', project:null, category:null, travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:5000, emiMonths:5, urgency:'urgent', status:'pending', appliedDate:'2026-03-06', reviewedBy:null, reviewDate:null, rejectReason:null},
  {id:2, type:'site', empCode:'SSC003', empName:'N.Hari Haran', dept:'Site', amount:45000, reason:null, details:'Cement & steel for foundation', project:'Porur Villa Project', category:'Material', travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:null, emiMonths:null, urgency:'normal', status:'pending', appliedDate:'2026-03-05', reviewedBy:null, reviewDate:null, rejectReason:null},
  {id:3, type:'travel', empCode:'SSM003', empName:'Krishna Gowri Sankar.S', dept:'Factory', amount:539, reason:null, details:'Daily commute to factory', project:null, category:null, travelFrom:'Tambaram', travelTo:'Kundrathur Factory', vehicle:'Bike', travelKm:28, emiAmount:null, emiMonths:null, urgency:'normal', status:'pending', appliedDate:'2026-03-04', reviewedBy:null, reviewDate:null, rejectReason:null},
  {id:4, type:'salary', empCode:'SSC008', empName:'Karthik Rajan', dept:'Office', amount:15000, reason:'Education', details:'Course fee', project:null, category:null, travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:5000, emiMonths:3, urgency:'normal', status:'pending', appliedDate:'2026-03-04', reviewedBy:null, reviewDate:null, rejectReason:null},
  {id:5, type:'site', empCode:'SSC025', empName:'Harish.V', dept:'Site', amount:18400, reason:null, details:'Labour payment - 8 workers daily wages', project:'Tambaram Warehouse', category:'Labour', travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:null, emiMonths:null, urgency:'urgent', status:'approved', appliedDate:'2026-02-28', reviewedBy:'Selvam (MD)', reviewDate:'2026-03-01', rejectReason:null},
  {id:6, type:'salary', empCode:'SSC025', empName:'Harish.V', dept:'Site', amount:10000, reason:'Emergency', details:'Family emergency', project:null, category:null, travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:5000, emiMonths:2, urgency:'urgent', status:'approved', appliedDate:'2026-02-28', reviewedBy:'Selvam (MD)', reviewDate:'2026-03-01', rejectReason:null},
  {id:7, type:'travel', empCode:'SSM002', empName:'Govarthanan', dept:'Factory', amount:1014, reason:null, details:'Factory commute Dec 2025', project:null, category:null, travelFrom:'Home', travelTo:'Kundrathur Factory', vehicle:'Bike', travelKm:45, emiAmount:null, emiMonths:null, urgency:'normal', status:'approved', appliedDate:'2026-02-20', reviewedBy:'Priyanka (HR)', reviewDate:'2026-02-22', rejectReason:null},
  {id:8, type:'salary', empCode:'SSC012', empName:'Murugan.S', dept:'Office', amount:50000, reason:'Housing', details:'Home repair', project:null, category:null, travelFrom:null, travelTo:null, vehicle:null, travelKm:null, emiAmount:10000, emiMonths:5, urgency:'normal', status:'rejected', appliedDate:'2026-02-25', reviewedBy:'Selvam (MD)', reviewDate:'2026-02-26', rejectReason:'Exceeds 50% salary limit'}
];
let advNextId = 9;
let advSelectedType = 'site';
let advSelectedUrgency = 'normal';
let advReqActiveTab = 'pending';

function openAdvanceApplyForm(type) {
  type = type || 'site';
  document.getElementById('advAmount').value = '';
  document.getElementById('advDetails').value = '';
  document.getElementById('advReason').value = '';
  document.getElementById('advEmi').value = '';
  document.getElementById('advEmiCalc').textContent = '';
  document.getElementById('advSiteProject').value = '';
  document.getElementById('advSiteCategory').value = '';
  document.getElementById('advTravelFrom').value = '';
  document.getElementById('advTravelTo').value = '';
  document.getElementById('advTravelVehicle').value = '';
  document.getElementById('advTravelKm').value = '';
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
  if (advSelectedType !== 'salary') return;
  const amount = parseInt(document.getElementById('advAmount').value, 10) || 0;
  const emi = parseInt(document.getElementById('advEmi').value, 10) || 0;
  const el = document.getElementById('advEmiCalc');
  if (amount > 0 && emi > 0) {
    const months = Math.ceil(amount / emi);
    el.textContent = 'Repayment: ' + months + ' month' + (months > 1 ? 's' : '') + ' @ \u20B9' + emi.toLocaleString('en-IN') + '/month';
  } else {
    el.textContent = '';
  }
}

async function submitAdvanceRequest() {
  const amount = parseInt(document.getElementById('advAmount').value, 10) || 0;
  const details = document.getElementById('advDetails').value.trim();
  if (!amount) { showToast('Please enter the amount'); return; }

  let reason = null, emiAmount = null, emiMonths = null;
  let project = null, category = null;
  let travelFrom = null, travelTo = null, vehicle = null, travelKm = null;

  if (advSelectedType === 'salary') {
    reason = document.getElementById('advReason').value;
    emiAmount = parseInt(document.getElementById('advEmi').value, 10) || 0;
    if (!reason) { showToast('Please select a reason'); return; }
    if (!emiAmount) { showToast('Please enter preferred EMI amount'); return; }
    if (emiAmount > amount) { showToast('EMI cannot exceed the advance amount'); return; }
    emiMonths = Math.ceil(amount / emiAmount);
  } else if (advSelectedType === 'site') {
    project = document.getElementById('advSiteProject').value;
    category = document.getElementById('advSiteCategory').value;
    if (!project) { showToast('Please select a project/site'); return; }
    if (!category) { showToast('Please select a category'); return; }
  } else if (advSelectedType === 'travel') {
    travelFrom = document.getElementById('advTravelFrom').value.trim();
    travelTo = document.getElementById('advTravelTo').value.trim();
    vehicle = document.getElementById('advTravelVehicle').value;
    travelKm = parseInt(document.getElementById('advTravelKm').value, 10) || null;
    if (!travelFrom || !travelTo) { showToast('Please enter From and To locations'); return; }
    if (!vehicle) { showToast('Please select a vehicle type'); return; }
  }

  try {
    // Post to backend API
    const apiRes = await apiCall('POST', '/advances', {
      type: advSelectedType, amount, reason, details, project, category,
      travelFrom, travelTo, vehicle, travelKm, emiAmount, emiMonths,
      urgency: advSelectedUrgency
    });

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
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      reviewedBy: null, reviewDate: null, rejectReason: null
    });

    const typeLabel = ADV_TYPE_LABELS[advSelectedType];
    showToast(typeLabel + ' request submitted for \u20B9' + amount.toLocaleString('en-IN'));
    hideOverlay('advance-apply');
    renderAllMyRequests();
    renderAllPendingBanners();
  } catch (e) {
    showToast('Error submitting advance request');
  }
}

function getAdvMeta(r) {
  if (r.type === 'site') return `<strong>${escapeHTML(r.project)}</strong> &middot; ${escapeHTML(r.category)}${r.details ? ' &middot; ' + escapeHTML(r.details) : ''}`;
  if (r.type === 'salary') return `<strong>${escapeHTML(r.reason)}</strong>${r.details ? ' — ' + escapeHTML(r.details) : ''}<br>EMI: \u20B9${r.emiAmount.toLocaleString('en-IN')}/month for ${r.emiMonths} months`;
  if (r.type === 'travel') return `<strong>${escapeHTML(r.travelFrom)} \u2192 ${escapeHTML(r.travelTo)}</strong> &middot; ${escapeHTML(r.vehicle)}${r.travelKm ? ' &middot; ' + r.travelKm + ' km' : ''}${r.details ? '<br>' + escapeHTML(r.details) : ''}`;
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
  const pending = advanceRequests.filter(r => r.status === 'pending' && r.type === type).length;
  const allPending = advanceRequests.filter(r => r.status === 'pending').length;
  document.getElementById(countId).textContent = pending;
  document.getElementById(textId).textContent = pending + ' Pending ' + ADV_TYPE_LABELS[type] + (pending !== 1 ? 's' : '');
  banner.style.display = (currentUser.role === 'MD' || currentUser.role === 'HR') && pending > 0 ? 'flex' : 'none';
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

function renderAdvanceRequests(filter) {
  const container = document.getElementById('advReqList');
  let reqs = filter === 'all' ? [...advanceRequests] : advanceRequests.filter(r => r.status === filter);
  if (advReqTypeFilter !== 'all') reqs = reqs.filter(r => r.type === advReqTypeFilter);
  reqs.sort((a, b) => b.id - a.id);
  if (reqs.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--gray-400);font-size:.82rem">No ' + filter + ' requests</div>';
    return;
  }
  const isMDorHR = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  container.innerHTML = reqs.map(r => {
    const badgeClass = r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
    const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    const initials = r.empName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const typeBadge = `<span class="adv-type-badge ${r.type}">${ADV_TYPE_LABELS[r.type] || r.type}</span>`;
    return `<div class="adv-request-card ${r.status}">
      <div class="adv-request-header">
        <h4><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:var(--primary-50);color:var(--primary);font-size:.65rem;font-weight:700;margin-right:4px">${escapeHTML(initials)}</span>${escapeHTML(r.empName)}</h4>
        <span class="badge-status ${badgeClass}">${statusLabel}</span>
      </div>
      <div class="adv-request-meta">
        ${typeBadge} <span class="adv-urgency ${r.urgency}">${escapeHTML(r.urgency)}</span> &middot; <strong>\u20B9${r.amount.toLocaleString('en-IN')}</strong> &middot; ${escapeHTML(r.dept)}<br>
        ${getAdvMeta(r)}<br>
        Applied: ${formatAdvDate(r.appliedDate)}
        ${r.reviewedBy ? ' &middot; By: ' + escapeHTML(r.reviewedBy) + ' on ' + formatAdvDate(r.reviewDate) : ''}
        ${r.rejectReason ? '<br><span style="color:var(--danger)">Reason: ' + escapeHTML(r.rejectReason) + '</span>' : ''}
      </div>
      ${r.status === 'pending' && isMDorHR ? `<div class="adv-actions">
        <button class="approve-btn" onclick="approveAdvance(${r.id})" aria-label="Approve advance request ${r.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/></svg> Approve</button>
        <button class="reject-btn" onclick="rejectAdvance(${r.id})" aria-label="Reject advance request ${r.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

async function approveAdvance(id) {
  try {
    const req = advanceRequests.find(r => r.id === id);
    if (!req) return;
    await apiCall('PATCH', '/advances/' + id + '/approve');
    req.status = 'approved';
    req.reviewedBy = currentUser.name + ' (' + currentUser.role + ')';
    req.reviewDate = new Date().toISOString().split('T')[0];
    showToast('Approved \u20B9' + req.amount.toLocaleString('en-IN') + ' for ' + req.empName);
    renderAdvanceRequests(advReqActiveTab);
    renderAllPendingBanners();
  } catch (err) { showToast('Error approving advance'); }
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
  } catch (err) { showToast('Error rejecting advance'); }
}

function formatAdvDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
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
  var total = 0;
  var ratings = [];
  inputs.forEach(function(inp) {
    total += parseInt(inp.value, 10);
    ratings.push({ category: inp.dataset.cat || inp.name || 'General', rating: parseFloat(inp.value) / 20, comments: '' });
  });
  var avg = Math.round(total / inputs.length);
  KPI_DATA[empCode].selfRating = avg;
  apiCall('POST', '/kpi/self-rate', { period: new Date().getFullYear() + '-Q' + Math.ceil((new Date().getMonth() + 1) / 3), ratings: ratings });
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
var JOB_POSTINGS = [
  {id:1, title:'Civil Site Engineer', dept:'Site', openings:2, posted:'2026-02-15', status:'open', jd:'Min 3 yrs exp in civil construction. Diploma/B.E. Civil required.'},
  {id:2, title:'PEB Fabricator', dept:'PEB', openings:3, posted:'2026-02-20', status:'open', jd:'Skilled in PEB steel fabrication. ITI/Diploma preferred.'},
  {id:3, title:'Accounts Executive', dept:'Office', openings:1, posted:'2026-03-01', status:'open', jd:'B.Com/MBA Finance. Tally & GST knowledge required.'},
  {id:4, title:'Machine Operator', dept:'Factory', openings:2, posted:'2026-01-10', status:'closed', jd:'Experience with industrial machines. Safety training mandatory.'}
];

var CANDIDATES = [
  {id:1, name:'Aravind Kumar', role:'Civil Site Engineer', jobId:1, stage:'Applied', rating:3, phone:'9876543210', exp:'4 yrs'},
  {id:2, name:'Muthukumar.S', role:'Civil Site Engineer', jobId:1, stage:'Screening', rating:4, phone:'9876543211', exp:'5 yrs'},
  {id:3, name:'Pradeep Raj', role:'PEB Fabricator', jobId:2, stage:'Interview', rating:4, phone:'9876543212', exp:'3 yrs'},
  {id:4, name:'Sathish.V', role:'PEB Fabricator', jobId:2, stage:'Applied', rating:2, phone:'9876543213', exp:'2 yrs'},
  {id:5, name:'Deepa Nair', role:'Accounts Executive', jobId:3, stage:'Offer', rating:5, phone:'9876543214', exp:'6 yrs'},
  {id:6, name:'Ramkumar.M', role:'PEB Fabricator', jobId:2, stage:'Hired', rating:5, phone:'9876543215', exp:'7 yrs'},
  {id:7, name:'Jeeva.P', role:'Civil Site Engineer', jobId:1, stage:'Rejected', rating:2, phone:'9876543216', exp:'1 yr'},
  {id:8, name:'Anbu Selvan', role:'Accounts Executive', jobId:3, stage:'Screening', rating:3, phone:'9876543217', exp:'4 yrs'}
];

var PIPELINE_STAGES = ['Applied','Screening','Interview','Offer','Hired','Rejected'];

function renderRecruitmentOverlay() {
  var el = document.getElementById('hrRecruitContent');
  if (!el) return;
  var activeTab = el.dataset.rtab || 'postings';

  var pills = ['postings','pipeline'].map(function(t) {
    return '<button class="tab-pill' + (activeTab === t ? ' active' : '') + '" onclick="recruitTab(\'' + t + '\')">' + (t === 'postings' ? 'Open Positions' : 'Candidate Pipeline') + '</button>';
  }).join('');

  var content = '';
  if (activeTab === 'postings') {
    content = JOB_POSTINGS.map(function(j) {
      var candCount = CANDIDATES.filter(function(c) { return c.jobId === j.id; }).length;
      return '<div class="job-card fade-in">' +
        '<h4>' + j.title + '</h4>' +
        '<div class="job-meta">' +
          '<span>' + j.dept + '</span>' +
          '<span>' + j.openings + ' opening' + (j.openings > 1 ? 's' : '') + '</span>' +
          '<span>' + candCount + ' candidates</span>' +
          '<span>Posted ' + formatAdvDate(j.posted) + '</span>' +
        '</div>' +
        '<div style="font-size:.72rem;color:var(--gray-500);margin-bottom:10px;line-height:1.5">' + j.jd + '</div>' +
        '<div class="job-actions">' +
          '<span class="badge-status badge-' + (j.status === 'open' ? 'open' : 'pending') + '">' + j.status.charAt(0).toUpperCase() + j.status.slice(1) + '</span>' +
          (candCount > 0 ? '<button class="ai-screen-btn" style="margin-left:8px" onclick="aiScreenAllCandidates(' + j.id + ',this)">&#10024; Screen All</button>' : '') +
          (j.status === 'open' ? '<button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="showToast(\'Sharing job link...\')">Share</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  } else {
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
  }

  el.dataset.rtab = activeTab;
  el.innerHTML = '<div class="tab-pills" style="margin-bottom:14px">' + pills + '</div>' + content;
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
// DATA: DOCUMENTS
// =====================================================
var DOCUMENT_TEMPLATES = [
  {id:'offer', label:'Offer Letter', desc:'Official employment offer with CTC details', icon:'&#128196;'},
  {id:'nda', label:'NDA Agreement', desc:'Non-disclosure and confidentiality agreement', icon:'&#128274;'},
  {id:'appointment', label:'Appointment Letter', desc:'Formal appointment on company letterhead', icon:'&#128203;'},
  {id:'experience', label:'Experience Certificate', desc:'Experience & relieving certificate', icon:'&#127891;'}
];

var EMPLOYEE_DOCUMENTS = [
  {empCode:'SSC011', type:'offer', label:'Offer Letter', date:'2019-05-01', status:'Verified'},
  {empCode:'SSC011', type:'appointment', label:'Appointment Letter', date:'2019-05-01', status:'Verified'},
  {empCode:'SSC006', type:'nda', label:'NDA Agreement', date:'2019-08-01', status:'Verified'},
  {empCode:'SSC006', type:'offer', label:'Offer Letter', date:'2019-08-01', status:'Verified'},
  {empCode:'MD001', type:'offer', label:'Offer Letter', date:'2015-01-01', status:'Verified'}
];

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
var CAREER_PATHS = {
  'Office': [
    {level:1, title:'Office Assistant', salaryRange:'₹15K–20K', years:'0–2', requirements:[]},
    {level:2, title:'Junior Executive', salaryRange:'₹20K–30K', years:'2–4', requirements:['2 years experience','Computer proficiency']},
    {level:3, title:'Executive', salaryRange:'₹30K–45K', years:'4–7', requirements:['Team coordination','Reporting skills']},
    {level:4, title:'Senior Executive', salaryRange:'₹45K–65K', years:'7–10', requirements:['Project management','Leadership']},
    {level:5, title:'Manager', salaryRange:'₹65K+', years:'10+', requirements:['Department management','Strategic thinking']}
  ],
  'Site': [
    {level:1, title:'Site Helper', salaryRange:'₹15K–20K', years:'0–2', requirements:[]},
    {level:2, title:'Site Worker', salaryRange:'₹20K–28K', years:'2–4', requirements:['Site safety training']},
    {level:3, title:'Site Supervisor', salaryRange:'₹28K–40K', years:'4–8', requirements:['Supervisor certification','Team handling']},
    {level:4, title:'Foreman', salaryRange:'₹40K–55K', years:'8–12', requirements:['Project oversight','Budget management']},
    {level:5, title:'Site Manager', salaryRange:'₹55K+', years:'12+', requirements:['PMP/Civil degree','Multi-project management']}
  ],
  'Factory': [
    {level:1, title:'Factory Helper', salaryRange:'₹15K–22K', years:'0–2', requirements:[]},
    {level:2, title:'Machine Operator', salaryRange:'₹22K–30K', years:'2–4', requirements:['Machine operation training']},
    {level:3, title:'Senior Fabricator', salaryRange:'₹30K–42K', years:'4–7', requirements:['Quality certification','Skilled trade']},
    {level:4, title:'Factory Supervisor', salaryRange:'₹42K–55K', years:'7–12', requirements:['Production planning','Team leadership']},
    {level:5, title:'Production Manager', salaryRange:'₹55K+', years:'12+', requirements:['Operations management degree']}
  ],
  'PEB': [
    {level:1, title:'PEB Helper', salaryRange:'₹14K–18K', years:'0–2', requirements:[]},
    {level:2, title:'PEB Worker', salaryRange:'₹18K–25K', years:'2–4', requirements:['Steel fabrication basics']},
    {level:3, title:'PEB Fabricator', salaryRange:'₹25K–35K', years:'4–7', requirements:['Structural drawing reading']},
    {level:4, title:'PEB Supervisor', salaryRange:'₹35K–50K', years:'7–12', requirements:['PEB system expertise']},
    {level:5, title:'PEB Manager', salaryRange:'₹50K+', years:'12+', requirements:['Project & client management']}
  ],
  'Garden': [
    {level:1, title:'Gardener / Cleaner', salaryRange:'₹8K–15K', years:'0–3', requirements:[]},
    {level:2, title:'Head Gardener', salaryRange:'₹15K–20K', years:'3–7', requirements:['Horticulture knowledge']},
    {level:3, title:'Security & Facilities', salaryRange:'₹15K–22K', years:'3–8', requirements:['Security training','Premises management']}
  ]
};

function getCurrentCareerLevel(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return 1;
  var path = CAREER_PATHS[emp.dept] || CAREER_PATHS['Office'];
  var sal = emp.salary;
  var lvl = 1;
  path.forEach(function(p, i) {
    var low = parseInt((p.salaryRange.replace(/[₹K+\s]/g, '').split('–')[0] || '0'), 10) * 1000;
    if (sal >= low) lvl = i + 1;
  });
  return Math.min(lvl, path.length);
}

function renderCareerOverlay() {
  var el = document.getElementById('hrCareerContent');
  if (!el || !currentUser) return;
  var emp = currentUser;
  var path = CAREER_PATHS[emp.dept] || CAREER_PATHS['Office'];
  var currentLvl = getCurrentCareerLevel(emp.code);

  var timelineHtml = path.map(function(p, i) {
    var lvlNum = i + 1;
    var isDone = lvlNum < currentLvl;
    var isCurrent = lvlNum === currentLvl;
    var isNext = lvlNum === currentLvl + 1;
    var cls = isDone ? 'done' : isCurrent ? 'current' : isNext ? 'next' : '';
    var icon = isDone ? '&#10003;' : lvlNum;
    var reqHtml = '';
    if (isNext && p.requirements.length > 0) {
      reqHtml = '<div class="cl-reqs">' + p.requirements.map(function(r) {
        return '<div class="cl-req-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' + r + '</div>';
      }).join('') + '</div>';
    }
    return '<div class="career-level ' + cls + '">' +
      '<div class="cl-dot">' + icon + '</div>' +
      '<div class="cl-info">' +
        '<div class="cl-title">Level ' + lvlNum + ': ' + p.title + (isCurrent ? ' &nbsp;<span class="badge-status badge-open" style="font-size:.58rem">Current</span>' : '') + (isNext ? ' &nbsp;<span class="badge-status badge-pending" style="font-size:.58rem">Next</span>' : '') + '</div>' +
        '<div class="cl-subtitle">' + p.salaryRange + ' &middot; ' + p.years + ' years</div>' +
        reqHtml +
      '</div>' +
    '</div>';
  }).join('');

  el.innerHTML = '<div class="card fade-in" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,var(--primary-50),var(--primary-100));border:1px solid var(--primary-100)">' +
    '<div style="font-size:.75rem;font-weight:600;color:var(--primary-dark)">' + emp.name + '</div>' +
    '<div style="font-size:.68rem;color:var(--primary);margin-top:2px">' + emp.dept + ' Department &middot; Level ' + currentLvl + ' of ' + path.length + '</div>' +
  '</div>' +
  '<div class="section-title">Career Progression Path</div>' +
  '<div class="card fade-in" style="padding:14px"><div class="career-timeline">' + timelineHtml + '</div></div>';
}

// =====================================================
// DATA: INCENTIVE
// =====================================================
var INCENTIVE_SLABS = [
  {minScore:90, maxScore:100, percent:15, label:'Excellent'},
  {minScore:75, maxScore:89, percent:10, label:'Good'},
  {minScore:50, maxScore:74, percent:5, label:'Average'},
  {minScore:0, maxScore:49, percent:0, label:'Below Average'}
];

function calculateIncentive(empCode) {
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return {amount:0, percent:0, label:'N/A'};
  var score = getKpiScore(empCode);
  var slab = INCENTIVE_SLABS.find(function(s) { return score >= s.minScore && score <= s.maxScore; }) || INCENTIVE_SLABS[INCENTIVE_SLABS.length - 1];
  var amount = Math.round(emp.salary * slab.percent / 100);
  return {amount: amount, percent: slab.percent, label: slab.label, score: score};
}

function renderIncentiveOverlay() {
  var el = document.getElementById('hrIncentiveContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';

  var slabTable = '<div class="section-title">Incentive Slabs</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
      '<table style="width:100%;border-collapse:collapse;font-size:.75rem">' +
        '<thead><tr>' +
          '<th style="text-align:left;padding:6px 4px;color:var(--gray-500);font-weight:600;border-bottom:1px solid var(--gray-100)">KPI Score</th>' +
          '<th style="text-align:left;padding:6px 4px;color:var(--gray-500);font-weight:600;border-bottom:1px solid var(--gray-100)">Category</th>' +
          '<th style="text-align:right;padding:6px 4px;color:var(--gray-500);font-weight:600;border-bottom:1px solid var(--gray-100)">Incentive %</th>' +
        '</tr></thead>' +
        '<tbody>' +
          INCENTIVE_SLABS.map(function(s) {
            return '<tr>' +
              '<td style="padding:6px 4px">' + s.minScore + '–' + s.maxScore + '</td>' +
              '<td style="padding:6px 4px">' + s.label + '</td>' +
              '<td style="padding:6px 4px;text-align:right;font-weight:700;color:var(--primary)">' + s.percent + '%</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';

  if (isMDorHR) {
    var totalIncentive = 0;
    var rows = EMPLOYEES.map(function(e) {
      var inc = calculateIncentive(e.code);
      totalIncentive += inc.amount;
      var rag = getRAGStatus(inc.score);
      return '<div class="kpi-emp-row">' +
        '<div class="kpi-emp-score rag-' + rag + '">' + inc.score + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + e.name + '</div>' +
        '<div style="font-size:.65rem;color:var(--gray-400)">' + e.dept + ' &middot; Salary: &#8377;' + e.salary.toLocaleString('en-IN') + '</div></div>' +
        '<div style="text-align:right">' +
          '<div style="font-family:var(--font-display);font-size:.82rem;font-weight:700;color:var(--success-dark)">&#8377;' + inc.amount.toLocaleString('en-IN') + '</div>' +
          '<div style="font-size:.6rem;color:var(--gray-400)">' + inc.percent + '% · ' + inc.label + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML = '<div class="card fade-in" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,var(--success-light),#D1FAE5)">' +
      '<div style="font-size:.7rem;font-weight:600;color:var(--success-dark);text-transform:uppercase;letter-spacing:.04em">Total Incentive Payout (This Quarter)</div>' +
      '<div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--success-dark)">&#8377;' + totalIncentive.toLocaleString('en-IN') + '</div>' +
    '</div>' +
    slabTable +
    '<div class="section-title">Employee Incentive Breakdown</div>' +
    rows;
  } else {
    var inc = calculateIncentive(currentUser.code);
    el.innerHTML = '<div class="card fade-in" style="padding:20px;margin-bottom:12px;text-align:center;background:linear-gradient(135deg,var(--success-light),#D1FAE5)">' +
      '<div style="font-size:.72rem;font-weight:600;color:var(--success-dark);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Your Incentive This Quarter</div>' +
      '<div style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--success-dark)">&#8377;' + inc.amount.toLocaleString('en-IN') + '</div>' +
      '<div style="font-size:.75rem;color:var(--success-dark);opacity:.8;margin-top:4px">KPI Score: ' + inc.score + '/100 &middot; ' + inc.label + ' (' + inc.percent + '%)</div>' +
    '</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
      '<div class="kpi-target-item">' +
        '<div class="kpi-target-label"><span>Base Salary</span><span>&#8377;' + currentUser.salary.toLocaleString('en-IN') + '</span></div>' +
        '<div class="kpi-target-bar"><div class="kpi-target-bar-fill" style="width:100%;background:var(--primary)"></div></div>' +
      '</div>' +
      '<div class="kpi-target-item">' +
        '<div class="kpi-target-label"><span>Incentive (' + inc.percent + '%)</span><span>&#8377;' + inc.amount.toLocaleString('en-IN') + '</span></div>' +
        '<div class="kpi-target-bar"><div class="kpi-target-bar-fill" style="width:' + inc.percent + '%;background:var(--success)"></div></div>' +
      '</div>' +
    '</div>' +
    slabTable;
  }
}

// =====================================================
// DATA: TEMPERAMENT
// =====================================================
var TEMPERAMENT_QUIZ = [
  {id:1,type:'C',text:'I like to take charge and lead teams toward goals.'},
  {id:2,type:'C',text:'I am decisive and confident when making quick decisions.'},
  {id:3,type:'C',text:'I enjoy challenges and push myself to overcome obstacles.'},
  {id:4,type:'C',text:'I get frustrated when things move too slowly.'},
  {id:5,type:'C',text:'I am results-driven and focus on outcomes above all.'},
  {id:6,type:'M',text:'I prefer to plan carefully before taking action.'},
  {id:7,type:'M',text:'I notice details that others often miss.'},
  {id:8,type:'M',text:'I hold myself and others to high standards of quality.'},
  {id:9,type:'M',text:'I tend to be sensitive to criticism and take it personally.'},
  {id:10,type:'M',text:'I like to analyze situations thoroughly before deciding.'},
  {id:11,type:'S',text:'I love meeting new people and making friends quickly.'},
  {id:12,type:'S',text:'I am enthusiastic and can motivate others easily.'},
  {id:13,type:'S',text:'I enjoy being the center of attention in social settings.'},
  {id:14,type:'S',text:'I am spontaneous and embrace change with excitement.'},
  {id:15,type:'S',text:'I find it difficult to stick to routines for long periods.'},
  {id:16,type:'P',text:'I prefer peace and avoid confrontation whenever possible.'},
  {id:17,type:'P',text:'I am a reliable and steady presence in the team.'},
  {id:18,type:'P',text:'I listen carefully before sharing my own opinion.'},
  {id:19,type:'P',text:'I am patient and rarely get anxious under pressure.'},
  {id:20,type:'P',text:'I prefer working behind the scenes rather than leading.'}
];

var TEMPERAMENT_PROFILES = {
  'C': {
    name:'Choleric',emoji:'&#128293;',
    color:'#FEE2E2',textColor:'#DC2626',borderColor:'#FCA5A5',
    desc:'Natural leader, goal-driven, decisive and confident.',
    strengths:['Strong leadership','Quick decision-making','Goal-oriented','Decisive under pressure'],
    improvements:['Listen more to others','Control impatience','Avoid being too blunt','Delegate effectively'],
    bestRoles:['Project Manager','Site Supervisor','Team Lead','Director']
  },
  'M': {
    name:'Melancholy',emoji:'&#127752;',
    color:'#FFF7ED',textColor:'#E85D04',borderColor:'#FED7AA',
    desc:'Detail-oriented, analytical, high-quality standards.',
    strengths:['Attention to detail','High quality output','Strong analysis','Creative problem-solving'],
    improvements:['Be more flexible','Accept imperfections','Communicate openly','Avoid over-thinking'],
    bestRoles:['Architect','Accountant','Quality Checker','Data Analyst']
  },
  'S': {
    name:'Sanguine',emoji:'&#127774;',
    color:'#FEF3C7',textColor:'#D97706',borderColor:'#FDE68A',
    desc:'Enthusiastic, people-person, motivating and expressive.',
    strengths:['Strong communication','Team motivator','Adaptable','Creative energy'],
    improvements:['Stay focused on tasks','Improve follow-through','Manage time better','Listen more'],
    bestRoles:['HR Manager','Sales Executive','Trainer','PR Officer']
  },
  'P': {
    name:'Phlegmatic',emoji:'&#127774;',
    color:'#D1FAE5',textColor:'#059669',borderColor:'#A7F3D0',
    desc:'Steady, reliable, calm under pressure and diplomatic.',
    strengths:['Highly reliable','Calm under stress','Good mediator','Consistent performer'],
    improvements:['Be more assertive','Share ideas proactively','Embrace change','Set clearer goals'],
    bestRoles:['Operations','Support Staff','Mediator','Counsellor']
  }
};

var TEMPERAMENT_RESULTS = {};

function renderTemperamentOverlay() {
  var el = document.getElementById('hrTemperamentContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';
  var myResult = TEMPERAMENT_RESULTS[currentUser.code];

  if (!myResult) {
    var questions = TEMPERAMENT_QUIZ.map(function(q) {
      return '<div class="temp-statement">' +
        '<input type="checkbox" id="tq' + q.id + '" data-qtype="' + q.type + '">' +
        '<label for="tq' + q.id + '">' + q.text + '</label>' +
      '</div>';
    }).join('');
    el.innerHTML = '<div class="card fade-in" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,#FFF7ED,#FEF3C7)">' +
      '<div style="font-size:.82rem;font-weight:600;color:var(--warning-dark)">Discover Your Temperament Type</div>' +
      '<div style="font-size:.7rem;color:var(--warning-dark);opacity:.8;margin-top:4px">Select statements that feel most like you. Be honest for the best results.</div>' +
    '</div>' +
    '<div class="section-title">Select All That Apply To You</div>' +
    questions +
    '<button class="btn btn-primary w-full" style="margin-top:16px;border-radius:var(--radius-sm)" onclick="calculateTemperament()">Find My Type</button>';
  } else {
    var profile = TEMPERAMENT_PROFILES[myResult.primary] || TEMPERAMENT_PROFILES['S'];
    var secProfile = myResult.secondary ? TEMPERAMENT_PROFILES[myResult.secondary] : null;
    var strengthsList = profile.strengths.map(function(s) {
      return '<div class="temp-trait"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/></svg>' + s + '</div>';
    }).join('');
    var improvList = profile.improvements.map(function(s) {
      return '<div class="temp-trait"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>' + s + '</div>';
    }).join('');
    var rolesList = profile.bestRoles.map(function(r) {
      return '<span class="badge-status badge-open" style="font-size:.65rem">' + r + '</span>';
    }).join(' ');

    var distHtml = '';
    if (isMDorHR) {
      var typeCount = {C:0, M:0, S:0, P:0};
      Object.values(TEMPERAMENT_RESULTS).forEach(function(r) {
        if (r.primary && typeCount[r.primary] !== undefined) typeCount[r.primary]++;
      });
      var total = Object.values(typeCount).reduce(function(a,b) { return a+b; }, 1);
      distHtml = '<div class="section-title">Team Temperament Distribution</div>' +
        '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
          Object.keys(TEMPERAMENT_PROFILES).map(function(key) {
            var p = TEMPERAMENT_PROFILES[key];
            var cnt = typeCount[key];
            var pct = Math.round(cnt / total * 100);
            return '<div style="margin-bottom:10px">' +
              '<div style="display:flex;justify-content:space-between;font-size:.72rem;font-weight:600;margin-bottom:4px">' +
                '<span>' + p.emoji + ' ' + p.name + '</span><span>' + cnt + ' (' + pct + '%)</span>' +
              '</div>' +
              '<div class="temp-dist-bar"><div class="temp-dist-fill" style="width:' + pct + '%;background:' + p.textColor + '"></div></div>' +
            '</div>';
          }).join('') +
        '</div>';
    }

    el.innerHTML = '<div class="temp-result-card" style="background:' + profile.color + ';border:2px solid ' + profile.borderColor + '">' +
      '<div style="font-size:2rem;margin-bottom:6px">' + profile.emoji + '</div>' +
      '<div class="temp-type-badge" style="background:' + profile.textColor + ';color:white">Primary: ' + profile.name + '</div>' +
      (secProfile ? '<div style="font-size:.72rem;margin-top:4px;color:' + profile.textColor + '">Secondary: ' + secProfile.name + '</div>' : '') +
      '<div style="font-size:.78rem;color:' + profile.textColor + ';margin-top:8px;opacity:.9">' + profile.desc + '</div>' +
    '</div>' +
    '<div class="section-title">Strengths</div><div class="card fade-in" style="padding:12px;margin-bottom:12px">' + strengthsList + '</div>' +
    '<div class="section-title">Areas to Improve</div><div class="card fade-in" style="padding:12px;margin-bottom:12px">' + improvList + '</div>' +
    '<div class="section-title">Best Role Fits</div><div class="card fade-in" style="padding:12px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">' + rolesList + '</div>' +
    distHtml +
    '<button class="btn btn-outline w-full" style="margin-top:8px;border-radius:var(--radius-sm)" onclick="retakeTemperament()">Retake Quiz</button>';
  }
}

function calculateTemperament() {
  var scores = {C:0, M:0, S:0, P:0};
  document.querySelectorAll('#hrTemperamentContent input[type=checkbox]:checked').forEach(function(cb) {
    var t = cb.dataset.qtype;
    if (scores[t] !== undefined) scores[t]++;
  });
  var sorted = Object.keys(scores).sort(function(a,b) { return scores[b] - scores[a]; });
  TEMPERAMENT_RESULTS[currentUser.code] = {primary: sorted[0], secondary: sorted[1], scores: scores};
  showToast('Your type: ' + TEMPERAMENT_PROFILES[sorted[0]].name + '!');
  renderTemperamentOverlay();
}

function retakeTemperament() {
  delete TEMPERAMENT_RESULTS[currentUser.code];
  renderTemperamentOverlay();
}

// =====================================================
// DATA: TASKS
// =====================================================
var TASK_DATA = [
  {id:1, title:'Submit Monthly Attendance Sheet', type:'routine', assignedTo:'ALL', dueDate:'2026-03-31', priority:'normal', done:false, note:'Fill and submit by last working day of month'},
  {id:2, title:'Complete KPI Self-Rating Form', type:'routine', assignedTo:'ALL', dueDate:'2026-03-15', priority:'normal', done:false, note:'Submit before mid-month review'},
  {id:3, title:'Safety Briefing — Porur Site', type:'emergency', assignedTo:'Site', dueDate:'2026-03-09', priority:'urgent', done:false, note:'Mandatory attendance for all site staff'},
  {id:4, title:'Review PEB Extension Project Documents', type:'one-time', assignedTo:'SSC006', dueDate:'2026-03-12', priority:'normal', done:true, note:'HR to review and sign off documents'},
  {id:5, title:'Prepare March Payroll', type:'routine', assignedTo:'SSC006', dueDate:'2026-03-28', priority:'high', done:false, note:'Collect attendance from all departments first'},
  {id:6, title:'Quarterly Performance Meeting', type:'one-time', assignedTo:'MD001', dueDate:'2026-03-20', priority:'high', done:false, note:'All department heads to attend'},
  {id:7, title:'Update Employee Records — New Joiners', type:'routine', assignedTo:'SSC006', dueDate:'2026-03-10', priority:'normal', done:true, note:'Add SSC031, SSC032 to system'},
  {id:8, title:'Order Office Supplies', type:'routine', assignedTo:'Office', dueDate:'2026-03-15', priority:'low', done:false, note:'Check stock levels and order accordingly'},
  {id:9, title:'Factory Machine Maintenance Check', type:'routine', assignedTo:'Factory', dueDate:'2026-03-14', priority:'high', done:false, note:'Annual maintenance schedule — all machines'},
  {id:10, title:'New Employee Orientation', type:'one-time', assignedTo:'SSC006', dueDate:'2026-03-18', priority:'normal', done:false, note:'Conduct induction program for new hires'}
];

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
  apiCall('PATCH', '/tasks/' + taskId + '/toggle');
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
// DATA: SKILLS
// =====================================================
var SKILL_CATEGORIES = {
  visible: [
    {name:'Communication', key:'comm'},
    {name:'Technical Skills', key:'tech'},
    {name:'Problem Solving', key:'prob'},
    {name:'Teamwork', key:'team'}
  ],
  hidden: [
    {name:'Attitude & Mindset', key:'attitude'},
    {name:'Integrity & Ethics', key:'integrity'},
    {name:'Emotional Intelligence', key:'eq'},
    {name:'Initiative & Drive', key:'drive'}
  ]
};

var SKILL_RATINGS = {};

function getSkillRatings(empCode) {
  if (!SKILL_RATINGS[empCode]) {
    var all = SKILL_CATEGORIES.visible.concat(SKILL_CATEGORIES.hidden);
    var ratings = {};
    all.forEach(function(s) {
      var selfVal = 5 + Math.floor(Math.abs(Math.sin(empCode.length + s.key.length) * 5));
      var mgrVal = 4 + Math.floor(Math.abs(Math.cos(empCode.charCodeAt(0) + s.key.length) * 6));
      if (selfVal > 10) selfVal = 10;
      if (mgrVal > 10) mgrVal = 10;
      ratings[s.key] = {self: selfVal, manager: mgrVal};
    });
    SKILL_RATINGS[empCode] = ratings;
  }
  return SKILL_RATINGS[empCode];
}

function renderSkillsOverlay() {
  var el = document.getElementById('hrSkillsContent');
  if (!el || !currentUser) return;
  var emp = currentUser;
  var ratings = getSkillRatings(emp.code);

  var visibleRows = SKILL_CATEGORIES.visible.map(function(s) {
    return '<div class="skill-slider-row">' +
      '<label>' + s.name + '</label>' +
      '<input type="range" min="1" max="10" value="' + ratings[s.key].self + '" oninput="updateSkillVal(this,\'' + emp.code + '\',\'' + s.key + '\',\'self\')">' +
      '<span class="skill-val" id="sv_' + s.key + '">' + ratings[s.key].self + '</span>' +
    '</div>';
  }).join('');

  var hiddenRows = SKILL_CATEGORIES.hidden.map(function(s) {
    return '<div class="skill-slider-row">' +
      '<label>' + s.name + '</label>' +
      '<input type="range" min="1" max="10" value="' + ratings[s.key].self + '" oninput="updateSkillVal(this,\'' + emp.code + '\',\'' + s.key + '\',\'self\')">' +
      '<span class="skill-val" id="sv_' + s.key + '">' + ratings[s.key].self + '</span>' +
    '</div>';
  }).join('');

  var gapRows = SKILL_CATEGORIES.visible.concat(SKILL_CATEGORIES.hidden).map(function(s) {
    var r = ratings[s.key];
    var gap = r.self - r.manager;
    var gapClass = gap >= 0 ? 'positive' : 'negative';
    var gapStr = (gap >= 0 ? '+' : '') + gap;
    return '<div class="skill-gap-item">' +
      '<span class="sg-name">' + s.name + '</span>' +
      '<span class="sg-self">' + r.self + '</span>' +
      '<span style="color:var(--gray-300);font-size:.7rem">|</span>' +
      '<span class="sg-mgr">' + r.manager + '</span>' +
      '<span class="sg-gap ' + gapClass + '">' + gapStr + '</span>' +
    '</div>';
  }).join('');

  el.innerHTML = '<div class="section-title" style="margin-top:0">Skills Iceberg</div>' +
    '<div class="iceberg-container fade-in">' +
      '<div class="iceberg-visible">' +
        '<h5>Above the Surface</h5>' +
        '<div class="iceberg-label">Visible Skills — what others see</div>' +
        SKILL_CATEGORIES.visible.map(function(s) {
          return '<span class="badge-status badge-open" style="margin:2px;font-size:.6rem">' + s.name + '</span>';
        }).join('') +
      '</div>' +
      '<div style="text-align:center;padding:4px;background:linear-gradient(180deg,#3B82F6,#1D4ED8);font-size:.6rem;color:rgba(255,255,255,.5);font-style:italic">—— waterline ——</div>' +
      '<div class="iceberg-hidden">' +
        '<h5>Below the Surface</h5>' +
        '<div class="iceberg-label" style="margin-bottom:6px">Hidden Strengths — deeper character</div>' +
        SKILL_CATEGORIES.hidden.map(function(s) {
          return '<span class="badge-status" style="margin:2px;font-size:.6rem;background:rgba(255,255,255,.15);color:white">' + s.name + '</span>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="section-title">Self-Assessment: Visible Skills</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' + visibleRows + '</div>' +
    '<div class="section-title">Self-Assessment: Hidden Skills</div>' +
    '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' + hiddenRows + '</div>' +
    '<div class="section-title">Self vs Manager Ratings</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:14px;font-size:.65rem;font-weight:600;margin-bottom:6px">' +
      '<span style="color:var(--primary)">Self</span>' +
      '<span style="color:var(--success-dark)">Manager</span>' +
      '<span style="color:var(--gray-500)">Gap</span>' +
    '</div>' +
    gapRows +
    '<button class="btn btn-primary w-full" style="margin-top:16px;border-radius:var(--radius-sm)" onclick="showToast(\'Skill ratings saved!\')">Save Self-Assessment</button>';
}

function updateSkillVal(input, empCode, key, ratingType) {
  var val = parseInt(input.value, 10);
  var ratings = getSkillRatings(empCode);
  ratings[key][ratingType] = val;
  var el = document.getElementById('sv_' + key);
  if (el) el.textContent = val;
}

// =====================================================
// DATA: HOT SEAT
// =====================================================
var HOT_SEAT_SESSIONS = [
  {
    id:1, empCode:'SSC003', empName:'N.Hari Haran', dept:'Site',
    date:'2026-03-05', conductor:'Selvam (MD)', status:'completed',
    goals:['Improve site coordination with factory team','Reduce material wastage by 15%'],
    challenges:['Communication delays between site and office','Labour absenteeism on Mondays'],
    wins:['Porur project ahead of schedule by 1 week','Zero safety incidents in Feb 2026'],
    feedback:['Great site management — peer review by Priyanka'],
    nextSession:'2026-06-05'
  },
  {
    id:2, empCode:'SSC006', empName:'Priyanka', dept:'Office',
    date:'2026-02-20', conductor:'Selvam (MD)', status:'completed',
    goals:['Complete onboarding system setup','Reduce payroll processing time'],
    challenges:['Manual attendance collection from site/factory','Lack of HR documentation system'],
    wins:['Successfully implemented attendance tracking','Processed all Dec salaries on time'],
    feedback:['Very proactive — peer review by Vishnu Kumar'],
    nextSession:'2026-05-20'
  },
  {
    id:3, empCode:'SSM003', empName:'Krishna Gowri Sankar.S', dept:'Factory',
    date:'2026-03-15', conductor:'Priyanka (HR)', status:'upcoming',
    goals:['Achieve quality cert for PEB fabrication','Mentor 2 junior fabricators'],
    challenges:['Equipment downtime affecting productivity'],
    wins:[],
    feedback:[],
    nextSession:'2026-03-15'
  }
];

function renderHotSeatOverlay() {
  var el = document.getElementById('hrHotseatContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';

  var sessions = isMDorHR ? HOT_SEAT_SESSIONS : HOT_SEAT_SESSIONS.filter(function(s) { return s.empCode === currentUser.code; });

  var infoCard = '<div class="card fade-in" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,#FFF7ED,#FEF3C7);border:1px solid #FDE68A">' +
    '<div style="font-size:.82rem;font-weight:600;color:var(--warning-dark)">HOT Seat Program</div>' +
    '<div style="font-size:.72rem;color:#B45309;margin-top:4px;line-height:1.5">Honest Open Transparent sessions where leaders and employees align on goals, challenges and wins every quarter.</div>' +
  '</div>';

  var sessionCards = sessions.length > 0 ? sessions.map(function(s) {
    var goalsHtml = s.goals.map(function(g) { return '<li style="font-size:.73rem;margin-bottom:3px">' + g + '</li>'; }).join('');
    var challengesHtml = s.challenges.map(function(c) { return '<li style="font-size:.73rem;margin-bottom:3px">' + c + '</li>'; }).join('');
    var winsHtml = s.wins.length > 0 ? s.wins.map(function(w) { return '<li style="font-size:.73rem;margin-bottom:3px">' + w + '</li>'; }).join('') : '<li style="font-size:.73rem;color:var(--gray-400)">Session upcoming</li>';
    var fbHtml = s.feedback.length > 0 ? s.feedback.map(function(f) { return '<div class="temp-trait"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' + f + '</div>'; }).join('') : '';
    return '<div class="hot-seat-card fade-in">' +
      '<h4>' + s.empName + ' &nbsp;<span class="badge-status badge-' + (s.status === 'completed' ? 'approved' : 'pending') + '" style="font-size:.6rem">' + s.status + '</span></h4>' +
      '<div class="hs-meta">' +
        '<span>' + s.dept + '</span>' +
        '<span>Date: ' + formatAdvDate(s.date) + '</span>' +
        '<span>By: ' + s.conductor + '</span>' +
        (s.nextSession ? '<span>Next: ' + formatAdvDate(s.nextSession) + '</span>' : '') +
      '</div>' +
      '<div class="hs-section"><h5>Goals Set</h5><ul style="padding-left:16px">' + goalsHtml + '</ul></div>' +
      '<div class="hs-section"><h5>Challenges Discussed</h5><ul style="padding-left:16px">' + challengesHtml + '</ul></div>' +
      '<div class="hs-section"><h5>Wins Celebrated</h5><ul style="padding-left:16px">' + winsHtml + '</ul></div>' +
      (fbHtml ? '<div class="hs-section"><h5>Peer Feedback</h5>' + fbHtml + '</div>' : '') +
      (isMDorHR ? '<button class="btn btn-sm btn-outline" style="margin-top:10px" onclick="addPeerFeedback(' + s.id + ')">Add Feedback</button>' : '') +
    '</div>';
  }).join('') : '<div style="text-align:center;padding:32px;color:var(--gray-400);font-size:.82rem">No HOT Seat sessions found.</div>';

  var scheduleForm = '';
  if (isMDorHR) {
    var empOptions = EMPLOYEES.map(function(e) {
      return '<option value="' + e.code + '">' + e.name + ' (' + e.code + ')</option>';
    }).join('');
    scheduleForm = '<div class="section-title">Schedule New Session</div>' +
      '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
        '<div class="form-row"><label>Employee</label><select id="hsEmpSelect">' + empOptions + '</select></div>' +
        '<div class="form-row"><label>Session Date</label><input type="date" id="hsDate"></div>' +
        '<div class="form-row"><label>Conductor</label><input type="text" id="hsConductor" value="' + currentUser.name + ' (' + currentUser.role + ')"></div>' +
        '<button class="btn btn-primary w-full" style="border-radius:var(--radius-sm);margin-top:8px" onclick="scheduleHotSeat()">Schedule Session</button>' +
      '</div>';
  }

  el.innerHTML = infoCard + scheduleForm + '<div class="section-title">Sessions</div>' + sessionCards;
}

function addPeerFeedback(sessionId) {
  var feedback = prompt('Enter peer feedback for this session:');
  if (!feedback) return;
  var session = HOT_SEAT_SESSIONS.find(function(s) { return s.id === sessionId; });
  if (session) {
    session.feedback.push(feedback + ' — ' + currentUser.name);
    showToast('Feedback added successfully');
    renderHotSeatOverlay();
  }
}

function scheduleHotSeat() {
  var empCode = document.getElementById('hsEmpSelect').value;
  var date = document.getElementById('hsDate').value;
  var conductor = document.getElementById('hsConductor').value.trim();
  if (!date) { showToast('Please select a date'); return; }
  var emp = EMPLOYEES.find(function(e) { return e.code === empCode; });
  if (!emp) return;
  var newId = HOT_SEAT_SESSIONS.length > 0 ? Math.max.apply(null, HOT_SEAT_SESSIONS.map(function(s) { return s.id; })) + 1 : 1;
  HOT_SEAT_SESSIONS.push({
    id: newId, empCode: empCode, empName: emp.name, dept: emp.dept,
    date: date, conductor: conductor || currentUser.name, status: 'upcoming',
    goals: [], challenges: [], wins: [], feedback: [], nextSession: null
  });
  showToast('HOT Seat scheduled for ' + emp.name + ' on ' + formatAdvDate(date));
  renderHotSeatOverlay();
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
  var vision = document.getElementById('personalVisionText').value.trim();
  var goals = document.getElementById('personalGoalsText').value.trim();
  PERSONAL_VISIONS[currentUser.code] = {vision: vision, goals: goals};
  showToast('Personal vision saved!');
}

// =====================================================
// DATA: EVENTS & AWARDS
// =====================================================
var EVENTS = [
  {id:1, title:'Annual Day Celebration', type:'celebration', date:'2026-04-15', desc:'Company annual day with awards, performances and dinner.', dept:'ALL'},
  {id:2, title:'Safety Training Workshop', type:'training', date:'2026-03-20', desc:'Mandatory safety training for all site and factory staff.', dept:'Site'},
  {id:3, title:'Q1 Performance Review Meeting', type:'meeting', date:'2026-03-25', desc:'Department heads and MD to review Q1 targets and progress.', dept:'ALL'},
  {id:4, title:'Diwali Celebration', type:'celebration', date:'2025-10-20', desc:'Office Diwali party — sweets and bonuses distributed.', dept:'ALL'},
  {id:5, title:'New Employee Induction', type:'training', date:'2026-03-18', desc:'Orientation for new joiners SSC031 and SSC032.', dept:'ALL'},
  {id:6, title:'Client Appreciation Day', type:'meeting', date:'2026-04-01', desc:'Top clients invited to factory and site visit.', dept:'Office'}
];

var AWARDS = [
  {id:1, empCode:'SSM003', empName:'Krishna Gowri Sankar.S', award:'Best Fabricator 2025', desc:'Exceptional quality output and zero rework incidents.', month:'Dec 2025', icon:'&#127942;'},
  {id:2, empCode:'SSC003', empName:'N.Hari Haran', award:'Site Star Award', desc:'Delivered Porur project 1 week ahead of schedule.', month:'Feb 2026', icon:'&#11088;'},
  {id:3, empCode:'SSC006', empName:'Priyanka', award:'HR Excellence Award', desc:'Successfully digitized HR processes and payroll.', month:'Jan 2026', icon:'&#127891;'},
  {id:4, empCode:'SSC011', empName:'Vishnu Kumar', award:'Consistent Performer', desc:'100% attendance and top KPI score for Q3 2025.', month:'Oct 2025', icon:'&#127942;'}
];

function renderEventsOverlay() {
  var el = document.getElementById('hrEventsContent');
  if (!el || !currentUser) return;
  var isMDorHR = currentUser.role === 'MD' || currentUser.role === 'HR';
  var activeTab = el.dataset.etab || 'events';

  var pills = ['events','milestones','awards'].map(function(t) {
    var labels = {events:'Events', milestones:'Milestones', awards:'Awards Wall'};
    return '<button class="tab-pill' + (activeTab === t ? ' active' : '') + '" onclick="eventsTab(\'' + t + '\')">' + labels[t] + '</button>';
  }).join('');

  var content = '';
  if (activeTab === 'events') {
    var addForm = '';
    if (isMDorHR) {
      addForm = '<div class="card fade-in" style="padding:14px;margin-bottom:12px">' +
        '<div style="font-size:.78rem;font-weight:600;color:var(--gray-700);margin-bottom:10px">Add New Event</div>' +
        '<div class="form-row"><label>Event Title</label><input type="text" id="newEventTitle" placeholder="Event name"></div>' +
        '<div class="form-grid">' +
          '<div class="form-row"><label>Date</label><input type="date" id="newEventDate"></div>' +
          '<div class="form-row"><label>Type</label><select id="newEventType"><option value="celebration">Celebration</option><option value="training">Training</option><option value="meeting">Meeting</option><option value="birthday">Birthday</option><option value="anniversary">Anniversary</option></select></div>' +
        '</div>' +
        '<div class="form-row"><label>Description</label><textarea id="newEventDesc" rows="2" placeholder="Brief description"></textarea></div>' +
        '<button class="btn btn-primary w-full" style="border-radius:var(--radius-sm);margin-top:8px" onclick="addEvent()">Add Event</button>' +
      '</div>';
    }
    content = addForm + EVENTS.map(function(e) {
      var d = new Date(e.date);
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '<div class="event-card fade-in">' +
        '<div class="event-date-box">' +
          '<div class="ed-day">' + d.getDate() + '</div>' +
          '<div class="ed-mon">' + months[d.getMonth()] + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:.82rem;font-weight:600;margin-bottom:4px">' + e.title + '</div>' +
          '<div style="font-size:.68rem;color:var(--gray-400);margin-bottom:4px">' + e.desc + '</div>' +
          '<span class="event-type-badge ' + e.type + '">' + e.type.charAt(0).toUpperCase() + e.type.slice(1) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  } else if (activeTab === 'milestones') {
    var now = new Date();
    var milestones = EMPLOYEES.map(function(e) {
      var doj = new Date(e.doj);
      var years = Math.floor((now - doj) / (1000 * 60 * 60 * 24 * 365.25));
      var nextAnniv = new Date(doj);
      nextAnniv.setFullYear(now.getFullYear());
      if (nextAnniv < now) nextAnniv.setFullYear(now.getFullYear() + 1);
      var daysUntil = Math.ceil((nextAnniv - now) / (1000 * 60 * 60 * 24));
      return {emp: e, years: years + 1, nextAnniv: nextAnniv, daysUntil: daysUntil};
    }).sort(function(a, b) { return a.daysUntil - b.daysUntil; });

    content = '<div style="margin-bottom:12px;font-size:.75rem;color:var(--gray-400);font-weight:500">Upcoming work anniversaries, sorted by nearest date</div>' +
      milestones.slice(0, 15).map(function(m) {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var soon = m.daysUntil <= 30;
        return '<div class="event-card fade-in">' +
          '<div class="event-date-box" style="' + (soon ? 'background:var(--warning-light)' : '') + '">' +
            '<div class="ed-day" style="' + (soon ? 'color:var(--warning-dark)' : '') + '">' + m.nextAnniv.getDate() + '</div>' +
            '<div class="ed-mon" style="' + (soon ? 'color:var(--warning-dark)' : '') + '">' + months[m.nextAnniv.getMonth()] + '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:.82rem;font-weight:600;margin-bottom:2px">' + m.emp.name + '</div>' +
            '<div style="font-size:.68rem;color:var(--gray-400);margin-bottom:4px">' + m.emp.dept + ' &middot; ' + m.years + ' year' + (m.years !== 1 ? 's' : '') + ' anniversary</div>' +
            (soon ? '<span class="badge-status badge-pending" style="font-size:.6rem">In ' + m.daysUntil + ' days</span>' : '<span style="font-size:.65rem;color:var(--gray-400)">' + m.daysUntil + ' days away</span>') +
          '</div>' +
        '</div>';
      }).join('');
  } else {
    content = '<div style="margin-bottom:12px;font-size:.75rem;color:var(--gray-400);font-weight:500">Recognizing excellence at Swetha Structures</div>' +
      AWARDS.map(function(a) {
        return '<div class="award-card fade-in">' +
          '<div class="award-icon">' + a.icon + '</div>' +
          '<div class="award-info">' +
            '<h4>' + a.award + '</h4>' +
            '<p>' + a.empName + ' &middot; ' + a.month + '</p>' +
            '<p style="margin-top:2px">' + a.desc + '</p>' +
          '</div>' +
        '</div>';
      }).join('');
  }

  el.dataset.etab = activeTab;
  el.innerHTML = '<div class="tab-pills" style="margin-bottom:14px">' + pills + '</div>' + content;
}

function eventsTab(tab) {
  var el = document.getElementById('hrEventsContent');
  if (el) { el.dataset.etab = tab; renderEventsOverlay(); }
}

function addEvent() {
  var title = document.getElementById('newEventTitle').value.trim();
  var date = document.getElementById('newEventDate').value;
  var type = document.getElementById('newEventType').value;
  var desc = document.getElementById('newEventDesc').value.trim();
  if (!title || !date) { showToast('Please enter event title and date'); return; }
  var newId = EVENTS.length > 0 ? Math.max.apply(null, EVENTS.map(function(e) { return e.id; })) + 1 : 1;
  EVENTS.push({id:newId, title:title, type:type, date:date, desc:desc || 'No description', dept:'ALL'});
  apiCall('POST', '/events', { title: title, eventDate: date, eventType: type, description: desc || '' });
  showToast('Event added: ' + title);
  renderEventsOverlay();
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
  var pendingApprovals = (typeof advanceRequests !== 'undefined') ? advanceRequests.filter(function(r) { return r.status === 'pending'; }).length : 0;
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

  // Attendance rate & extra metrics
  var rng = seededRandom('attend' + new Date().getMonth() + new Date().getFullYear());
  var attendRate = Math.round(88 + rng() * 10);

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
  var depts = ['Office','Site','Factory','PEB','Garden'];
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
    var rng2 = seededRandom('attend' + fm.mi + fm.y);
    return Math.round(88 + rng2() * 10);
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
    if (id === 'hr-recruit' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR');
      return;
    }
    if (id === 'hr-incentive' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR');
      return;
    }
    if (id === 'hr-hotseat' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR');
      return;
    }
    if (id === 'hr-analytics' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR');
      return;
    }

    if (id === 'hr-kpi') renderKpiOverlay();
    if (id === 'hr-recruit') renderRecruitmentOverlay();
    if (id === 'hr-documents') renderDocumentsOverlay();
    if (id === 'hr-career') renderCareerOverlay();
    if (id === 'hr-incentive') renderIncentiveOverlay();
    if (id === 'hr-temperament') renderTemperamentOverlay();
    if (id === 'hr-tasks') renderTasksOverlay();
    if (id === 'hr-skills') renderSkillsOverlay();
    if (id === 'hr-hotseat') renderHotSeatOverlay();
    if (id === 'hr-vision') renderVisionOverlay();
    if (id === 'hr-events') renderEventsOverlay();
    if (id === 'hr-analytics') renderAnalyticsOverlay();

    // New feature overlays (F1-F11)
    if (id === 'hr-shifts' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR'); return;
    }
    if (id === 'hr-compliance' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR'); return;
    }
    if (id === 'hr-assets' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR'); return;
    }
    if (id === 'hr-exit' && currentUser && currentUser.role !== 'MD' && currentUser.role !== 'HR') {
      showToast('Access restricted to MD and HR'); return;
    }
    if (id === 'hr-shifts') renderShiftsOverlay();
    if (id === 'hr-expenses') renderExpenseOverlay();
    if (id === 'self-service') { currentSsTab = 'details'; renderSelfServiceOverlay(); }
    if (id === 'attendance-log') renderAttendanceLogOverlay();
    if (id === 'hr-tax') { currentTaxTab = 'declaration'; renderTaxOverlay(); }
    if (id === 'hr-compliance') { currentComplianceTab = 'filing'; renderComplianceOverlay(); }
    if (id === 'hr-assets') renderAssetsOverlay();
    if (id === 'hr-exit') renderExitOverlay();
    if (id === 'hr-orgchart') renderOrgchartOverlay();
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
  employees: 'hrms_employees',
  departments: 'hrms_departments',
  credentials: 'hrms_credentials',
  advanceRequests: 'hrms_advance_requests',
  advNextId: 'hrms_adv_next_id',
  kpiData: 'hrms_kpi_data',
  jobPostings: 'hrms_job_postings',
  candidates: 'hrms_candidates',
  employeeDocuments: 'hrms_employee_documents',
  temperamentResults: 'hrms_temperament_results',
  taskData: 'hrms_task_data',
  skillRatings: 'hrms_skill_ratings',
  hotSeatSessions: 'hrms_hot_seat_sessions',
  personalVisions: 'hrms_personal_visions',
  events: 'hrms_events',
  awards: 'hrms_awards',
  attendanceLogs: 'hrms_attendance_logs',
  session: 'hrms_session',
  notifPref: 'hrms_notif_pref',
  biometricEnabled: 'hrms_biometric_enabled',
  notifHistory: 'hrms_notif_history',
  notifPrefs: 'hrms_notif_prefs',
  leaveApplications: 'hrms_leave_applications',
  leaveBalances: 'hrms_leave_balances',
  shiftAssignments: 'hrms_shift_assignments',
  expenseReimbursements: 'hrms_expense_reimbursements',
  expReimbNextId: 'hrms_exp_reimb_next_id',
  employeeSelfData: 'hrms_employee_self_data',
  taxDeclarations: 'hrms_tax_declarations',
  complianceFilings: 'hrms_compliance_filings',
  complianceNextId: 'hrms_compliance_next_id',
  contractWorkers: 'hrms_contract_workers',
  contractWorkerNextId: 'hrms_contract_worker_next_id',
  assetInventory: 'hrms_asset_inventory',
  assetNextId: 'hrms_asset_next_id',
  exitRequests: 'hrms_exit_requests',
  exitNextId: 'hrms_exit_next_id',
  announcements: 'hrms_announcements',
  announcementNextId: 'hrms_announcement_next_id',
  announcementReadStatus: 'hrms_announcement_read_status'
};

function saveAllData() {
  try {
    safeStorage.set(STORAGE_KEYS.employees, JSON.stringify(EMPLOYEES));
    safeStorage.set(STORAGE_KEYS.departments, JSON.stringify(departments));
    safeStorage.set(STORAGE_KEYS.credentials, JSON.stringify(CREDENTIAL_HASHES));
    safeStorage.set(STORAGE_KEYS.advanceRequests, JSON.stringify(advanceRequests));
    safeStorage.set(STORAGE_KEYS.advNextId, JSON.stringify(advNextId));
    safeStorage.set(STORAGE_KEYS.kpiData, JSON.stringify(KPI_DATA));
    safeStorage.set(STORAGE_KEYS.jobPostings, JSON.stringify(JOB_POSTINGS));
    safeStorage.set(STORAGE_KEYS.candidates, JSON.stringify(CANDIDATES));
    safeStorage.set(STORAGE_KEYS.employeeDocuments, JSON.stringify(EMPLOYEE_DOCUMENTS));
    safeStorage.set(STORAGE_KEYS.temperamentResults, JSON.stringify(TEMPERAMENT_RESULTS));
    safeStorage.set(STORAGE_KEYS.taskData, JSON.stringify(TASK_DATA));
    safeStorage.set(STORAGE_KEYS.skillRatings, JSON.stringify(SKILL_RATINGS));
    safeStorage.set(STORAGE_KEYS.hotSeatSessions, JSON.stringify(HOT_SEAT_SESSIONS));
    safeStorage.set(STORAGE_KEYS.personalVisions, JSON.stringify(PERSONAL_VISIONS));
    safeStorage.set(STORAGE_KEYS.events, JSON.stringify(EVENTS));
    safeStorage.set(STORAGE_KEYS.awards, JSON.stringify(AWARDS));
    safeStorage.set(STORAGE_KEYS.leaveApplications, JSON.stringify(leaveApplications));
    safeStorage.set(STORAGE_KEYS.leaveBalances, JSON.stringify(leaveBalances));
    safeStorage.set(STORAGE_KEYS.notifHistory, JSON.stringify(NOTIF_HISTORY));
    safeStorage.set(STORAGE_KEYS.notifPrefs, JSON.stringify(notifPrefs));
    safeStorage.set(STORAGE_KEYS.shiftAssignments, JSON.stringify(shiftAssignments));
    safeStorage.set(STORAGE_KEYS.expenseReimbursements, JSON.stringify(expenseReimbursements));
    safeStorage.set(STORAGE_KEYS.expReimbNextId, JSON.stringify(expReimbNextId));
    safeStorage.set(STORAGE_KEYS.employeeSelfData, JSON.stringify(employeeSelfData));
    safeStorage.set(STORAGE_KEYS.taxDeclarations, JSON.stringify(taxDeclarations));
    safeStorage.set(STORAGE_KEYS.complianceFilings, JSON.stringify(complianceFilings));
    safeStorage.set(STORAGE_KEYS.complianceNextId, JSON.stringify(complianceNextId));
    safeStorage.set(STORAGE_KEYS.contractWorkers, JSON.stringify(contractWorkers));
    safeStorage.set(STORAGE_KEYS.contractWorkerNextId, JSON.stringify(contractWorkerNextId));
    safeStorage.set(STORAGE_KEYS.assetInventory, JSON.stringify(assetInventory));
    safeStorage.set(STORAGE_KEYS.assetNextId, JSON.stringify(assetNextId));
    safeStorage.set(STORAGE_KEYS.exitRequests, JSON.stringify(exitRequests));
    safeStorage.set(STORAGE_KEYS.exitNextId, JSON.stringify(exitNextId));
    safeStorage.set(STORAGE_KEYS.announcements, JSON.stringify(announcements));
    safeStorage.set(STORAGE_KEYS.announcementNextId, JSON.stringify(announcementNextId));
    safeStorage.set(STORAGE_KEYS.announcementReadStatus, JSON.stringify(announcementReadStatus));
  } catch (e) {
    // Failed to save data
  }
}

function loadAllData() {
  try {
    const load = (key, target) => {
      const raw = safeStorage.get(key);
      if (raw) return JSON.parse(raw);
      return null;
    };

    let d;
    d = load(STORAGE_KEYS.employees); if (d) { EMPLOYEES.length = 0; d.forEach(e => EMPLOYEES.push(e)); }
    d = load(STORAGE_KEYS.departments); if (d) { departments.length = 0; d.forEach(e => departments.push(e)); }
    d = load(STORAGE_KEYS.credentials); if (d) { Object.keys(CREDENTIAL_HASHES).forEach(k => delete CREDENTIAL_HASHES[k]); Object.assign(CREDENTIAL_HASHES, d); }
    d = load(STORAGE_KEYS.advanceRequests); if (d) { advanceRequests.length = 0; d.forEach(e => advanceRequests.push(e)); }
    d = load(STORAGE_KEYS.advNextId); if (d !== null) advNextId = d;
    d = load(STORAGE_KEYS.kpiData); if (d) { Object.keys(KPI_DATA).forEach(k => delete KPI_DATA[k]); Object.assign(KPI_DATA, d); }
    d = load(STORAGE_KEYS.jobPostings); if (d) { JOB_POSTINGS.length = 0; d.forEach(e => JOB_POSTINGS.push(e)); }
    d = load(STORAGE_KEYS.candidates); if (d) { CANDIDATES.length = 0; d.forEach(e => CANDIDATES.push(e)); }
    d = load(STORAGE_KEYS.employeeDocuments); if (d) { EMPLOYEE_DOCUMENTS.length = 0; d.forEach(e => EMPLOYEE_DOCUMENTS.push(e)); }
    d = load(STORAGE_KEYS.temperamentResults); if (d) { Object.keys(TEMPERAMENT_RESULTS).forEach(k => delete TEMPERAMENT_RESULTS[k]); Object.assign(TEMPERAMENT_RESULTS, d); }
    d = load(STORAGE_KEYS.taskData); if (d) { TASK_DATA.length = 0; d.forEach(e => TASK_DATA.push(e)); }
    d = load(STORAGE_KEYS.skillRatings); if (d) { Object.keys(SKILL_RATINGS).forEach(k => delete SKILL_RATINGS[k]); Object.assign(SKILL_RATINGS, d); }
    d = load(STORAGE_KEYS.hotSeatSessions); if (d) { HOT_SEAT_SESSIONS.length = 0; d.forEach(e => HOT_SEAT_SESSIONS.push(e)); }
    d = load(STORAGE_KEYS.personalVisions); if (d) { Object.keys(PERSONAL_VISIONS).forEach(k => delete PERSONAL_VISIONS[k]); Object.assign(PERSONAL_VISIONS, d); }
    d = load(STORAGE_KEYS.events); if (d) { EVENTS.length = 0; d.forEach(e => EVENTS.push(e)); }
    d = load(STORAGE_KEYS.awards); if (d) { AWARDS.length = 0; d.forEach(e => AWARDS.push(e)); }
    d = load(STORAGE_KEYS.leaveApplications); if (d) { leaveApplications.length = 0; d.forEach(e => leaveApplications.push(e)); }
    d = load(STORAGE_KEYS.leaveBalances); if (d) { Object.keys(leaveBalances).forEach(k => delete leaveBalances[k]); Object.assign(leaveBalances, d); }
    d = load(STORAGE_KEYS.notifHistory); if (d) { NOTIF_HISTORY.length = 0; d.forEach(e => NOTIF_HISTORY.push(e)); }
    d = load(STORAGE_KEYS.notifPrefs); if (d) { Object.assign(notifPrefs, d); }
    d = load(STORAGE_KEYS.shiftAssignments); if (d) { Object.keys(shiftAssignments).forEach(k => delete shiftAssignments[k]); Object.assign(shiftAssignments, d); }
    d = load(STORAGE_KEYS.expenseReimbursements); if (d) { expenseReimbursements.length = 0; d.forEach(e => expenseReimbursements.push(e)); }
    d = load(STORAGE_KEYS.expReimbNextId); if (d !== null) expReimbNextId = d;
    d = load(STORAGE_KEYS.employeeSelfData); if (d) { Object.keys(employeeSelfData).forEach(k => delete employeeSelfData[k]); Object.assign(employeeSelfData, d); }
    d = load(STORAGE_KEYS.taxDeclarations); if (d) { Object.keys(taxDeclarations).forEach(k => delete taxDeclarations[k]); Object.assign(taxDeclarations, d); }
    d = load(STORAGE_KEYS.complianceFilings); if (d) { complianceFilings.length = 0; d.forEach(e => complianceFilings.push(e)); }
    d = load(STORAGE_KEYS.complianceNextId); if (d !== null) complianceNextId = d;
    d = load(STORAGE_KEYS.contractWorkers); if (d) { contractWorkers.length = 0; d.forEach(e => contractWorkers.push(e)); }
    d = load(STORAGE_KEYS.contractWorkerNextId); if (d !== null) contractWorkerNextId = d;
    d = load(STORAGE_KEYS.assetInventory); if (d) { assetInventory.length = 0; d.forEach(e => assetInventory.push(e)); }
    d = load(STORAGE_KEYS.assetNextId); if (d !== null) assetNextId = d;
    d = load(STORAGE_KEYS.exitRequests); if (d) { exitRequests.length = 0; d.forEach(e => exitRequests.push(e)); }
    d = load(STORAGE_KEYS.exitNextId); if (d !== null) exitNextId = d;
    d = load(STORAGE_KEYS.announcements); if (d) { announcements.length = 0; d.forEach(e => announcements.push(e)); }
    d = load(STORAGE_KEYS.announcementNextId); if (d !== null) announcementNextId = d;
    d = load(STORAGE_KEYS.announcementReadStatus); if (d) { Object.keys(announcementReadStatus).forEach(k => delete announcementReadStatus[k]); Object.assign(announcementReadStatus, d); }
  } catch (e) {
    // Failed to load data
  }
}

function clearAllData() {
  if (!confirm('This will reset ALL data to defaults. Are you sure?')) return;
  Object.values(STORAGE_KEYS).forEach(k => safeStorage.remove(k));
  showToast('All data cleared. Refreshing...');
  setTimeout(() => location.reload(), 800);
}

// =====================================================
// DATA EXPORT / IMPORT
// =====================================================
function exportAllData() {
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

// Auto-save wrapper — patches all mutation functions
(function() {
  const wrapWithSave = (fnName) => {
    const original = window[fnName];
    if (typeof original === 'function') {
      window[fnName] = function() {
        const result = original.apply(this, arguments);
        saveAllData();
        return result;
      };
    }
  };
  // Patch all functions that mutate data
  [
    'submitOnboarding', 'changeRole', 'addDepartment',
    'submitAdvanceRequest', 'approveAdvance', 'rejectAdvance',
    'submitSelfRating', 'moveCandidateStagePrompt', 'aiScreenCandidate', 'aiScreenAllCandidates', 'generateDocument',
    'calculateTemperament', 'retakeTemperament',
    'toggleTaskStatus', 'assignTask',
    'updateSkillVal', 'addPeerFeedback', 'scheduleHotSeat',
    'savePersonalVision', 'addEvent',
    'submitLeave', 'approveLeave', 'rejectLeave',
    'assignShift', 'submitExpenseReimbursement', 'approveExpense', 'rejectExpense',
    'updatePersonalDetails', 'submitTaxDeclaration', 'markFiled', 'addContractWorker',
    'saveAsset', 'assignAsset', 'returnAsset',
    'submitResignation', 'approveExit', 'updateClearance', 'completeExit',
    'createAnnouncement', 'deleteAnnouncement'
  ].forEach(wrapWithSave);
})();

// =====================================================
// REAL AUTHENTICATION WITH HASHED PASSWORDS
// =====================================================
// hashPassword removed — credentials now stored as pre-computed SHA-256 hashes

// Login overrides removed — doLogin and demoLogin now handle hashed auth directly

// Auto-login from saved session
function tryAutoLogin() {
  try {
    const raw = safeStorage.get(STORAGE_KEYS.session);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session.token || Date.now() > session.expiry) {
      safeStorage.remove(STORAGE_KEYS.session);
      return false;
    }
    loginAs(session.empIndex);
    return true;
  } catch (e) { return false; }
}

// Override logout to clear session
const _origDoLogout = doLogout;
doLogout = function() {
  safeStorage.remove(STORAGE_KEYS.session);
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

// Change password
async function changePassword() {
  const oldPass = document.getElementById('chgOldPass').value;
  const newPass = document.getElementById('chgNewPass').value;
  const confirmPass = document.getElementById('chgConfirmPass').value;

  if (!oldPass || !newPass || !confirmPass) { showToast('Please fill all fields'); return; }
  if (newPass.length < 4) { showToast('Password must be at least 4 characters'); return; }
  if (newPass !== confirmPass) { showToast('Passwords do not match'); return; }

  // Try API first
  const result = await apiCall('POST', '/auth/change-password', { oldPassword: oldPass, newPassword: newPass });
  if (result && result.error) { showToast(result.error); return; }
  if (result && result.message) {
    showToast('Password changed successfully!');
    document.getElementById('chgOldPass').value = '';
    document.getElementById('chgNewPass').value = '';
    document.getElementById('chgConfirmPass').value = '';
    return;
  }

  // Fallback to localStorage
  const cred = CREDENTIAL_HASHES[currentUser.code];
  const oldHash = await sha256(oldPass);
  if (cred.hash !== oldHash) { showToast('Current password is incorrect'); return; }
  cred.hash = await sha256(newPass);
  saveAllData();
  showToast('Password changed successfully!');
  document.getElementById('chgOldPass').value = '';
  document.getElementById('chgNewPass').value = '';
  document.getElementById('chgConfirmPass').value = '';
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
  exportToCSV(EMPLOYEES, 'employees.csv', [
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
  exportToCSV(EMPLOYEES, 'salary_dec2025.csv', [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'Designation', key:'designation'},
    {label:'Gross Salary', key:'salary'},
    {label:'Bank', key:'bank'}, {label:'Account', key:'accNo'},
    {label:'Net Pay', key:'salary'}
  ]);
}

function exportAttendanceReport() {
  const data = EMPLOYEES.map(e => ({
    name: e.name, code: e.code, dept: e.dept,
    present: Math.floor(Math.random() * 5) + 22,
    absent: Math.floor(Math.random() * 3),
    halfDay: Math.floor(Math.random() * 2),
    leave: Math.floor(Math.random() * 2)
  }));
  exportToCSV(data, 'attendance_march2026.csv', [
    {label:'Name', key:'name'}, {label:'Code', key:'code'},
    {label:'Department', key:'dept'}, {label:'Present', key:'present'},
    {label:'Absent', key:'absent'}, {label:'Half Day', key:'halfDay'},
    {label:'Leave', key:'leave'}
  ]);
}

function exportTaskReport() {
  exportToCSV(TASK_DATA, 'tasks.csv', [
    {label:'Title', key:'title'}, {label:'Type', key:'type'},
    {label:'Assigned To', key:'assignedTo'}, {label:'Due Date', key:'dueDate'},
    {label:'Priority', key:'priority'},
    {label:'Status', key: t => t.done ? 'Done' : 'Pending'},
    {label:'Note', key:'note'}
  ]);
}

function exportAdvanceReport() {
  exportToCSV(advanceRequests, 'advances.csv', [
    {label:'Employee', key:'empName'}, {label:'Code', key:'empCode'},
    {label:'Type', key:'type'}, {label:'Amount', key:'amount'},
    {label:'Status', key:'status'}, {label:'Urgency', key:'urgency'},
    {label:'Applied Date', key:'appliedDate'},
    {label:'Reviewed By', key:'reviewedBy'},
    {label:'Details', key:'details'}
  ]);
}

function exportAnalyticsReport() {
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
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 14, 12); } catch(e) {
    doc.setFillColor(...primaryLight); doc.roundedRect(lm, y, 12, 12, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text('SS', lm+2.5, y+7.8);
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primary);
  doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm + 16, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...midGray);
  doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035  |  GSTIN: 33AAWCS9286M1Z6', lm + 16, y + 10);

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
let attendanceLogs; try { attendanceLogs = JSON.parse(safeStorage.get(STORAGE_KEYS.attendanceLogs) || '[]'); } catch { attendanceLogs = []; }

function gpsCheckIn() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  const btn = document.getElementById('gpsCheckinBtn');
  if (btn) btn.textContent = 'Getting location...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const log = {
        empCode: currentUser.code,
        type: 'checkin',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      attendanceLogs.push(log);
      safeStorage.set(STORAGE_KEYS.attendanceLogs, JSON.stringify(attendanceLogs));
      saveAllData();
      showToast(`Checked in at ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
      sendNotification('Check-In Recorded', `Location: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`, 'checkin');
      if (btn) btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/></svg>Checked In';
      updateCheckinCard(pos.coords);
    },
    (err) => {
      showToast('Location error: ' + err.message);
      if (btn) btn.textContent = 'Check In';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function gpsCheckOut() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const log = {
        empCode: currentUser.code, type: 'checkout',
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy, timestamp: new Date().toISOString()
      };
      attendanceLogs.push(log);
      safeStorage.set(STORAGE_KEYS.attendanceLogs, JSON.stringify(attendanceLogs));
      showToast('Checked out successfully');
      sendNotification('Check-Out Recorded', `Time: ${new Date().toLocaleTimeString()}`, 'checkout');
    },
    (err) => showToast('Location error: ' + err.message),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function updateCheckinCard(coords) {
  const locBar = document.querySelector('.checkin-card .checkin-date');
  if (locBar && coords) {
    locBar.textContent += ` | GPS: ${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`;
  }
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
        let captures; try { captures = JSON.parse(safeStorage.get('hrms_captures') || '[]'); } catch { captures = []; }
        captures.push({ id: targetId, data: base64, date: new Date().toISOString() });
        // Keep only last 20 captures to manage storage
        if (captures.length > 20) captures.shift();
        safeStorage.set('hrms_captures', JSON.stringify(captures));
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

      const cred = CREDENTIAL_HASHES[matchedCode];
      if (cred) {
        const session = {
          empIndex: cred.idx,
          token: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
          expiry: Date.now() + 24 * 60 * 60 * 1000,
          rememberMe: true
        };
        safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
        loginAs(cred.idx);
        showToast('Biometric login successful!');
        return true;
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

    // Try backend first
    try {
      const backendRes = await fetch(API_BASE + '/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, name: userInfo.name, picture: userInfo.picture })
      });
      const data = await backendRes.json();
      if (backendRes.ok && data.token) {
        JWT_TOKEN = data.token;
        safeStorage.set('hrms_jwt', data.token);
        const empIdx = EMPLOYEES.findIndex(e => e.code === data.user.empCode);
        if (empIdx >= 0) { loginAs(empIdx); showToast('Signed in with Google'); return true; }
      }
    } catch (_) {}

    // Local fallback: match email or auto-register
    const gEmail = userInfo.email.toLowerCase();
    let empIdx = EMPLOYEES.findIndex(e => e.email && e.email.toLowerCase() === gEmail);

    if (empIdx < 0) {
      const nextNum = EMPLOYEES.length + 1;
      const newCode = 'SSC' + String(nextNum).padStart(3, '0');
      const displayName = userInfo.name || userInfo.email.split('@')[0];
      const newEmp = {
        code: newCode, name: displayName, dept: 'Office', designation: 'New Employee',
        salary: 0, bank: 'TBD', accNo: 'TBD', role: 'Employee',
        phone: '', doj: new Date().toISOString().split('T')[0],
        email: userInfo.email, picture: userInfo.picture || ''
      };
      EMPLOYEES.push(newEmp);
      CREDENTIAL_HASHES[newCode] = { hash: DEFAULT_HASH, idx: EMPLOYEES.length - 1 };
      empIdx = EMPLOYEES.length - 1;
      saveAllData();
      try { await apiCall('POST', '/employees', newEmp); } catch (_) {}
      showToast('Welcome ' + escapeHTML(displayName) + '! Account created. Contact MD/HR for role assignment.');
    }

    const session = {
      empIndex: empIdx,
      token: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      rememberMe: false
    };
    safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
    // Clear hash only after successful login
    history.replaceState(null, '', location.pathname + location.search);
    loginAs(empIdx);
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
window.addEventListener('online', () => { isOnline = true; _hideOfflineBanner(); syncOfflineQueue(); });
window.addEventListener('offline', () => { isOnline = false; _showOfflineBanner(); });

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (JWT_TOKEN) h['Authorization'] = 'Bearer ' + JWT_TOKEN;
  return h;
}

async function apiCall(method, path, body) {
  if (!isOnline) {
    queueOfflineMutation(method, path, body);
    return null;
  }
  try {
    const opts = { method, headers: apiHeaders() };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) {
      JWT_TOKEN = null;
      safeStorage.remove('hrms_jwt');
      return null;
    }
    return await res.json();
  } catch (e) {
    // API call failed, using localStorage fallback
    return null;
  }
}

// Offline mutation queue
function queueOfflineMutation(method, path, body) {
  let queue; try { queue = JSON.parse(safeStorage.get('hrms_offline_queue') || '[]'); } catch { queue = []; }
  queue.push({ method, path, body, timestamp: Date.now() });
  safeStorage.set('hrms_offline_queue', JSON.stringify(queue));
}

async function syncOfflineQueue() {
  let queue; try { queue = JSON.parse(safeStorage.get('hrms_offline_queue') || '[]'); } catch { queue = []; }
  if (queue.length === 0) return;
  let synced = 0;
  for (const item of queue) {
    try {
      const opts = { method: item.method, headers: apiHeaders() };
      if (item.body && item.method !== 'GET') opts.body = JSON.stringify(item.body);
      await fetch(API_BASE + item.path, opts);
      synced++;
    } catch (e) { break; }
  }
  if (synced > 0) {
    const remaining = queue.slice(synced);
    safeStorage.set('hrms_offline_queue', JSON.stringify(remaining));
    if (synced > 0) showToast(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
  }
}

// Enhanced login — try API first, fall back to localStorage
const _apiDoLogin = doLogin;
doLogin = async function() {
  const id = document.getElementById('loginId').value.trim().toUpperCase();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  if (!id) { err.textContent = 'Please enter Employee Code'; return; }

  // Try backend API first
  if (isOnline) {
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empCode: id, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        JWT_TOKEN = data.token;
        safeStorage.set('hrms_jwt', data.token);
        // Find employee index
        const idx = EMPLOYEES.findIndex(e => e.code === id);
        if (idx >= 0) {
          const session = { empIndex: idx, token: data.token, expiry: Date.now() + 24*60*60*1000, rememberMe: document.getElementById('rememberMe')?.checked || false };
          safeStorage.set(STORAGE_KEYS.session, JSON.stringify(session));
          loginAs(idx);
          requestNotificationPermission();
          syncOfflineQueue();
          return;
        }
      }
    } catch (e) {
      // API login failed, using local auth
    }
  }
  // Fall back to localStorage auth
  await _apiDoLogin();
};

// Seed data to backend on first API-connected login
async function seedBackendData() {
  if (!isOnline || !JWT_TOKEN) return;
  const seeded = safeStorage.get('hrms_backend_seeded');
  if (seeded) return;
  try {
    await apiCall('POST', '/auth/seed', { employees: EMPLOYEES, credentials: CREDENTIAL_HASHES });
    // Seed advance requests
    for (const adv of advanceRequests) {
      await apiCall('POST', '/advances', adv);
    }
    // Seed tasks
    for (const t of TASK_DATA) {
      await apiCall('POST', '/tasks', { title: t.title, type: t.type, assignedTo: t.assignedTo, dueDate: t.dueDate, priority: t.priority, note: t.note });
    }
    safeStorage.set('hrms_backend_seeded', 'true');
    // Backend seeded
  } catch (e) {
    // Backend seed failed
  }
}

// Wire API calls to mutation functions where the backend is available
(function wireApiCalls() {
  // Advance requests — sync to API
  const _origSubmitAdvance = submitAdvanceRequest;
  if (typeof _origSubmitAdvance === 'function') {
    window.submitAdvanceRequest = function() {
      _origSubmitAdvance.apply(this, arguments);
      const latest = advanceRequests[advanceRequests.length - 1];
      if (latest) apiCall('POST', '/advances', latest);
    };
  }

  const _origApproveAdv = approveAdvance;
  if (typeof _origApproveAdv === 'function') {
    window.approveAdvance = function(id) {
      _origApproveAdv(id);
      apiCall('PATCH', '/advances/' + id + '/approve', {});
    };
  }

  const _origRejectAdv = rejectAdvance;
  if (typeof _origRejectAdv === 'function') {
    window.rejectAdvance = function(id) {
      _origRejectAdv(id);
      const req = advanceRequests.find(r => r.id === id);
      apiCall('PATCH', '/advances/' + id + '/reject', { reason: req ? req.rejectReason : '' });
    };
  }

  // Tasks — sync to API
  const _origToggleTask = toggleTaskStatus;
  if (typeof _origToggleTask === 'function') {
    window.toggleTaskStatus = function(idx) {
      _origToggleTask(idx);
      const task = TASK_DATA[idx];
      if (task) apiCall('PATCH', '/tasks/' + (idx + 1) + '/toggle', {});
    };
  }

  // GPS check-in — sync to API
  const _origGpsCheckIn = gpsCheckIn;
  window.gpsCheckIn = function() {
    _origGpsCheckIn();
    // The original already uses geolocation; we additionally POST to API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        apiCall('POST', '/attendance/checkin', { lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {});
    }
  };

  const _origGpsCheckOut = gpsCheckOut;
  window.gpsCheckOut = function() {
    _origGpsCheckOut();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        apiCall('POST', '/attendance/checkout', { lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {});
    }
  };
})();

// =====================================================
// DESKTOP SIDEBAR FOOTER (Profile, Settings, Logout)
// =====================================================
(function initDesktopSidebar() {
  let footer = null;
  let wasDesktop = window.innerWidth >= 768;

  function ensureFooter() {
    if (footer) return footer;
    const tabs = document.getElementById('bottomTabs');
    if (!tabs) return null;
    footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <button class="sidebar-footer-btn" onclick="showOverlay('profile')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </button>
      <button class="sidebar-footer-btn" onclick="showOverlay('settings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <span>Settings</span>
      </button>
      <button class="sidebar-footer-btn logout-btn" onclick="doLogout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Log Out</span>
      </button>`;
    tabs.appendChild(footer);
    return footer;
  }

  // Create immediately if desktop
  if (wasDesktop) ensureFooter();

  window.addEventListener('resize', () => {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop && !wasDesktop) {
      const f = ensureFooter();
      if (f) f.style.display = '';
    }
    if (!isDesktop && wasDesktop && footer) { footer.style.display = 'none'; }
    wasDesktop = isDesktop;
  });
})();

// =====================================================
// DARK MODE
// =====================================================
function initDarkMode() {
  const saved = safeStorage.get('hrms_dark_mode');
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
    safeStorage.set('hrms_dark_mode', 'false');
    if (toggle) toggle.classList.remove('on');
  } else {
    html.setAttribute('data-theme', 'dark');
    document.querySelector('meta[name="theme-color"]').content = '#0F1117';
    safeStorage.set('hrms_dark_mode', 'true');
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
    try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 12, 10); } catch(e) {
      doc.setFillColor(99,102,241); doc.roundedRect(lm, y, 10, 10, 2, 2, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255); doc.text('SS', lm+1.5, y+6.5);
    }
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...primary); doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm+14, y+4);
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...mid); doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035 | GSTIN: 33AAWCS9286M1Z6', lm+14, y+8);
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
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', lm, y, 14, 12); } catch(e) {
    doc.setFillColor(99,102,241); doc.roundedRect(lm, y, 12, 12, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text('SS', lm+2.5, y+7.8);
  }
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...primary); doc.text('SWETHA STRUCTURES PRIVATE LIMITED', lm+16, y+5);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...mid); doc.text('No.44, Alagu Nagar, Saravanampatti, Coimbatore, TN 641035 | GSTIN: 33AAWCS9286M1Z6', lm+16, y+10);
  y += 18; doc.setDrawColor(...primary); doc.setLineWidth(0.6); doc.line(lm, y, rm, y);
  y += 8; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...dark);
  doc.text('ATTENDANCE REPORT — ' + mName + ' ' + yr, pw/2, y, {align:'center'});
  y += 8;

  // Summary
  let totalPresent = 0, totalCount = EMPLOYEES.length;
  const empData = EMPLOYEES.map(emp => {
    const rng = seededRandom(emp.code + now.getMonth() + yr);
    const present = Math.min(Math.max(workingDays - Math.floor(rng() * 6), workingDays - 5), workingDays);
    const remaining = workingDays - present;
    const absent = Math.min(Math.floor(rng() * 3), remaining);
    const half = Math.min(Math.floor(rng() * 2), remaining - absent);
    const leave = remaining - absent - half;
    const holiday = daysInMonth - workingDays;
    const pct = Math.round((present + half * 0.5) / workingDays * 100);
    totalPresent += pct;
    return { emp, present, absent, half, leave, holiday, pct };
  });
  const avgAtt = Math.round(totalPresent / totalCount);

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
  doc.text('SWETHA STRUCTURES PVT LTD', 14, 8);
  doc.setFont('helvetica','normal'); doc.setFontSize(5);
  doc.text('EMPLOYEE IDENTITY CARD', 14, 13);
  // Logo
  try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', 2, 2, 10, 9); } catch(e) {
    doc.setFillColor(255,255,255); doc.roundedRect(3, 3, 9, 9, 2, 2, 'F');
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
  // Fire browser notification if pref allows
  if (notifPrefs[category] !== false) {
    sendNotification(title, body, category + '-' + Date.now());
  }
  try { safeStorage.set(STORAGE_KEYS.notifHistory, JSON.stringify(NOTIF_HISTORY)); } catch(e){}
  // Persist to backend
  apiCall('POST', '/notifications', { title, body, category });
}

function updateNotifBadge() {
  const badge = document.querySelector('.header-btn .badge');
  const unread = NOTIF_HISTORY.filter(n => !n.read).length;
  if (badge) badge.style.display = unread > 0 ? '' : 'none';
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
    payroll: {bg:'var(--primary-50)',color:'var(--primary)',svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'}
  };
  const defaultIcon = iconMap.salary;
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
  apiCall('PATCH', '/notifications/' + id + '/read');
}

function markAllNotifRead() {
  NOTIF_HISTORY.forEach(n => n.read = true);
  renderNotifications(); updateNotifBadge();
  try { safeStorage.set(STORAGE_KEYS.notifHistory, JSON.stringify(NOTIF_HISTORY)); } catch(e){}
  apiCall('PATCH', '/notifications/read-all');
}

function toggleNotifPref(key, btn) {
  btn.classList.toggle('on');
  notifPrefs[key] = btn.classList.contains('on');
  try { safeStorage.set(STORAGE_KEYS.notifPrefs, JSON.stringify(notifPrefs)); } catch(e){}
  apiCall('PUT', '/notifications/prefs', notifPrefs);
}

function restoreNotifPrefToggles() {
  ['salary','leave','advance','payroll'].forEach(k => {
    const el = document.getElementById('notifPref' + k.charAt(0).toUpperCase() + k.slice(1));
    if (el) el.classList.toggle('on', notifPrefs[k] !== false);
  });
}

// =====================================================
// FEATURE 6: MOCK BACKEND
// =====================================================
const MOCK_BACKEND = {
  store: {},
  init() {
    this.store = {
      employees: [...EMPLOYEES],
      advances: [...(typeof advanceRequests !== 'undefined' ? advanceRequests : [])],
      leaves: [...leaveApplications],
      attendance: []
    };
  },
  handleRequest(method, path, body) {
    const route = path.replace(/^\/api/, '');
    if (route === '/auth/login' && method === 'POST') {
      const emp = EMPLOYEES.find(e => e.code === (body && body.code));
      if (emp) return { success: true, token: 'mock-jwt-' + emp.code, employee: emp };
      return { success: false, error: 'Invalid credentials' };
    }
    if (route === '/employees' && method === 'GET') return { employees: this.store.employees };
    if (route === '/advances' && method === 'GET') return { advances: this.store.advances };
    if (route === '/advances' && method === 'POST') {
      const adv = { id: Date.now(), ...body, status: 'pending', date: new Date().toISOString() };
      this.store.advances.push(adv); return { success: true, advance: adv };
    }
    if (route === '/leaves' && method === 'GET') return { leaves: this.store.leaves };
    if (route === '/leaves' && method === 'POST') {
      const lv = { id: Date.now(), ...body, status: 'pending', date: new Date().toISOString() };
      this.store.leaves.push(lv); return { success: true, leave: lv };
    }
    if (route === '/attendance/checkin' && method === 'POST') {
      const log = { ...body, type: 'checkin', timestamp: new Date().toISOString() };
      this.store.attendance.push(log); return { success: true, log };
    }
    if (route === '/attendance/checkout' && method === 'POST') {
      const log = { ...body, type: 'checkout', timestamp: new Date().toISOString() };
      this.store.attendance.push(log); return { success: true, log };
    }
    if (route === '/auth/seed' && method === 'POST') return { success: true };
    return { error: 'Not found' };
  }
};

// Patch apiCall to fallback to mock backend
(function() {
  const _origApiCall = apiCall;
  apiCall = async function(method, path, body) {
    const result = await _origApiCall(method, path, body);
    if (result !== null) return result;
    // Fallback to mock
    try { return MOCK_BACKEND.handleRequest(method, path, body); } catch(e) { return null; }
  };
})();

// Patch syncOfflineQueue to use mock
(function() {
  const _origSync = syncOfflineQueue;
  syncOfflineQueue = async function() {
    let queue; try { queue = JSON.parse(safeStorage.get('hrms_offline_queue') || '[]'); } catch { queue = []; }
    if (queue.length === 0) return;
    let synced = 0;
    for (const item of queue) {
      try {
        const opts = { method: item.method, headers: apiHeaders() };
        if (item.body && item.method !== 'GET') opts.body = JSON.stringify(item.body);
        await fetch(API_BASE + item.path, opts);
        synced++;
      } catch(e) {
        // Try mock backend
        try { MOCK_BACKEND.handleRequest(item.method, item.path, item.body); synced++; } catch(e2) { break; }
      }
    }
    if (synced > 0) {
      const remaining = queue.slice(synced);
      safeStorage.set('hrms_offline_queue', JSON.stringify(remaining));
      showToast('Synced ' + synced + ' offline change' + (synced > 1 ? 's' : ''));
    }
  };
})();

// =====================================================
// FEATURE 7: LEAVE MANAGEMENT WORKFLOW
// =====================================================
function getLeaveBalance(empCode) {
  if (!leaveBalances[empCode]) {
    leaveBalances[empCode] = { casual: 12, earned: 20, sick: 6, comp: 3 };
  }
  return leaveBalances[empCode];
}

function openLeaveForm() {
  document.getElementById('leaveFormOverlay').classList.add('active');
  selectedLeaveType = 'casual';
  document.querySelectorAll('#leaveTypePills .lt-pill').forEach((p,i) => p.classList.toggle('active', i===0));
  document.getElementById('leaveFromDate').value = '';
  document.getElementById('leaveToDate').value = '';
  document.getElementById('leaveReason').value = '';
}

function closeLeaveForm() {
  document.getElementById('leaveFormOverlay').classList.remove('active');
}

function selectLeaveType(type, el) {
  selectedLeaveType = type;
  document.querySelectorAll('#leaveTypePills .lt-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

async function submitLeave() {
  if (!currentUser) return;
  const from = document.getElementById('leaveFromDate').value;
  const to = document.getElementById('leaveToDate').value;
  const reason = document.getElementById('leaveReason').value.trim();
  if (!from || !to) { showToast('Please select dates'); return; }
  if (new Date(to) < new Date(from)) { showToast('End date must be after start date'); return; }
  if (!reason) { showToast('Please enter a reason'); return; }

  const days = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  const bal = getLeaveBalance(currentUser.code);
  const typeMap = { casual: 'casual', earned: 'earned', sick: 'sick', comp: 'comp' };
  const balKey = typeMap[selectedLeaveType];
  if (bal[balKey] < days) { showToast('Insufficient ' + selectedLeaveType + ' leave balance (' + bal[balKey] + ' remaining)'); return; }

  // Try API first
  const apiRes = await apiCall('POST', '/leaves', { type: selectedLeaveType, from, to, reason });

  const app = {
    id: (apiRes && apiRes.id) || leaveNextId++,
    empCode: currentUser.code,
    empName: currentUser.name,
    dept: currentUser.dept,
    type: selectedLeaveType,
    from, to, days, reason,
    status: 'pending',
    date: new Date().toISOString()
  };
  leaveApplications.push(app);
  closeLeaveForm();
  renderLeaveScreen();
  saveAllData();
  showToast('Leave application submitted');
  addNotification('Leave Applied', currentUser.name + ' applied for ' + days + ' day(s) ' + selectedLeaveType + ' leave', 'leave');
}

async function approveLeave(id) {
  try {
    const app = leaveApplications.find(a => a.id === id);
    if (!app) return;
    await apiCall('PATCH', '/leaves/' + id + '/approve');
    app.status = 'approved';
    const bal = getLeaveBalance(app.empCode);
    bal[app.type] = Math.max(0, bal[app.type] - app.days);
    renderLeaveScreen();
    saveAllData();
    showToast('Leave approved');
    addNotification('Leave Approved', app.empName + '\'s ' + app.type + ' leave approved (' + app.days + ' days)', 'leave');
  } catch (err) { showToast('Error approving leave'); }
}

async function rejectLeave(id) {
  try {
    const app = leaveApplications.find(a => a.id === id);
    if (!app) return;
    await apiCall('PATCH', '/leaves/' + id + '/reject');
    app.status = 'rejected';
    renderLeaveScreen();
    saveAllData();
    showToast('Leave rejected');
    addNotification('Leave Rejected', app.empName + '\'s ' + app.type + ' leave rejected', 'leave');
  } catch (err) { showToast('Error rejecting leave'); }
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
  const bal = getLeaveBalance(currentUser.code);
  const circumference = 163.4;

  // Balance grid
  const balGrid = document.getElementById('leaveBalanceGrid');
  if (balGrid) {
    const leaveTypes = [
      {key:'casual',label:'Casual Leave',total:12,color:'#E85D04',cls:'casual'},
      {key:'earned',label:'Earned Leave',total:20,color:'#22C55E',cls:'earned'},
      {key:'sick',label:'Sick Leave',total:6,color:'#F59E0B',cls:'sick'},
      {key:'comp',label:'Comp Off',total:3,color:'#EC4899',cls:'comp'}
    ];
    balGrid.innerHTML = '<div class="section-title" style="margin-top:4px">Leave Balance</div><div class="leave-balance-grid fade-in">' +
      leaveTypes.map(lt => {
        const rem = bal[lt.key];
        const used = lt.total - rem;
        const offset = circumference * (used / lt.total);
        return `<div class="leave-balance-card ${lt.cls}"><div class="donut-chart"><svg viewBox="0 0 65 65"><circle class="donut-bg" cx="32.5" cy="32.5" r="26"/><circle class="donut-fill" cx="32.5" cy="32.5" r="26" stroke="${lt.color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg><div class="donut-center">${rem}</div></div><div class="leave-type-name">${lt.label}</div><div class="leave-detail">${rem} of ${lt.total} remaining</div></div>`;
      }).join('') + '</div>';
  }

  // My leaves
  const myTab = document.getElementById('myLeavesTab');
  if (myTab) {
    const myApps = leaveApplications.filter(a => a.empCode === currentUser.code);
    if (myApps.length === 0) {
      myTab.innerHTML = '<div style="padding:16px;text-align:center;font-size:.78rem;color:var(--gray-400)">No leave applications yet</div>';
    } else {
      myTab.innerHTML = myApps.map(a => {
        const badgeCls = a.status === 'approved' ? 'badge-approved' : a.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
        const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
        const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
        return `<div class="request-item"><div class="req-icon" style="background:#FFF7ED;color:#E85D04"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg></div><div class="req-info"><h4>${a.type.charAt(0).toUpperCase()+a.type.slice(1)} Leave</h4><p>${fromD} — ${toD} &middot; ${a.days} day(s)</p></div><div class="req-meta"><span class="badge-status ${badgeCls}">${a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></div></div>`;
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
      const others = leaveApplications.filter(a => a.status !== 'pending');
      let html = '';
      if (pending.length > 0) {
        html += pending.map(a => {
          const fromD = new Date(a.from).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          const toD = new Date(a.to).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
          return `<div class="request-item" style="flex-wrap:wrap"><div class="req-icon" style="background:#FCE7F3;color:#DB2777"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="req-info"><h4>${escapeHTML(a.empName)} — ${escapeHTML(a.type)} Leave</h4><p>${escapeHTML(a.dept)} &middot; ${fromD} — ${toD} &middot; ${a.days} day(s)</p><p style="font-size:.65rem;color:var(--gray-500);margin-top:2px">${escapeHTML(a.reason)}</p></div><div class="leave-action-btns" style="width:100%;margin-top:8px"><button style="background:var(--success-light);color:var(--success-dark)" onclick="approveLeave(${a.id})">Approve</button><button style="background:var(--danger-light);color:var(--danger-dark)" onclick="rejectLeave(${a.id})">Reject</button></div></div>`;
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
function getEmployeeShift(empCode) {
  return shiftAssignments[empCode] || null;
}
function isShiftEligible(emp) {
  return SHIFT_ELIGIBLE_DEPTS.includes(emp.dept);
}
function assignShift(empCode, shiftCode) {
  shiftAssignments[empCode] = { shiftCode, assignedBy: currentUser.code, assignedDate: new Date().toISOString().split('T')[0] };
  apiCall('PUT', '/shifts/' + empCode, { shift_code: shiftCode });
  saveAllData();
  renderShiftsOverlay();
  showToast('Shift assigned successfully');
}
function toggleShiftEligibility(empCode) {
  if (shiftAssignments[empCode] && shiftAssignments[empCode].disabled) {
    delete shiftAssignments[empCode].disabled;
  } else {
    if (!shiftAssignments[empCode]) shiftAssignments[empCode] = {};
    shiftAssignments[empCode].disabled = true;
  }
  saveAllData();
  renderShiftsOverlay();
}
function renderMyShiftCard() {
  if (!currentUser || !isShiftEligible(currentUser)) return '';
  const assignment = getEmployeeShift(currentUser.code);
  const shift = assignment && assignment.shiftCode ? SHIFT_TYPES.find(s => s.code === assignment.shiftCode) : SHIFT_TYPES[0];
  return `<div class="my-shift-card"><h4>My Shift: ${shift.name}</h4><p>${shift.time}</p></div>`;
}
function renderShiftsOverlay() {
  const c = document.getElementById('shiftsContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  const eligible = EMPLOYEES.filter(e => isShiftEligible(e));
  let html = '<div class="nf-section"><div class="nf-section-title">Shift Types</div>';
  SHIFT_TYPES.forEach(s => {
    html += `<div class="shift-card"><div class="shift-badge" style="background:${s.color}20;color:${s.color}">${s.code}</div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${s.name}</div><div style="font-size:.72rem;color:var(--gray-500)">${s.time}</div></div></div>`;
  });
  html += '</div><div class="nf-section"><div class="nf-section-title">Factory Employees (' + eligible.length + ')</div>';
  eligible.forEach(emp => {
    const a = shiftAssignments[emp.code] || {};
    const disabled = a.disabled;
    const shift = a.shiftCode ? SHIFT_TYPES.find(s => s.code === a.shiftCode) : SHIFT_TYPES[0];
    html += `<div class="shift-card"><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${emp.name}</div><div style="font-size:.72rem;color:var(--gray-500)">${emp.designation}</div></div>`;
    if (disabled) {
      html += `<span style="font-size:.7rem;color:var(--gray-400)">Disabled</span>`;
    } else {
      html += `<div class="shift-badge" style="background:${shift.color}20;color:${shift.color}">${shift.name}</div>`;
    }
    if (isMdHr) {
      html += `<button class="shift-toggle ${disabled?'':'on'}" onclick="toggleShiftEligibility('${escapeAttr(emp.code)}')" title="Toggle eligibility" aria-label="Toggle shift eligibility for ${escapeAttr(emp.name)}"></button>`;
      if (!disabled) {
        html += `<select class="nf-select" style="width:auto;min-width:80px;font-size:.7rem;padding:4px 6px" onchange="assignShift('${escapeAttr(emp.code)}',this.value)" aria-label="Assign shift for ${escapeAttr(emp.name)}">`;
        SHIFT_TYPES.forEach(s => {
          html += `<option value="${s.code}" ${a.shiftCode===s.code?'selected':''}>${s.code}</option>`;
        });
        html += '</select>';
      }
    }
    html += '</div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

// =====================================================
// F2: EXPENSE REIMBURSEMENT FUNCTIONS
// =====================================================
function submitExpenseReimbursement() {
  const cat = document.getElementById('expCategory').value;
  const amount = parseFloat(document.getElementById('expAmount').value);
  const desc = document.getElementById('expDesc').value.trim();
  const date = document.getElementById('expDate').value;
  if (!cat || !amount || !date) { showToast('Please fill all required fields'); return; }
  const exp = {
    id: expReimbNextId++, empCode: currentUser.code, empName: currentUser.name, dept: currentUser.dept,
    category: cat, amount, description: desc, date, status: 'Pending',
    submittedOn: new Date().toISOString().split('T')[0]
  };
  expenseReimbursements.push(exp);
  apiCall('POST', '/expenses', { category: cat, amount, description: desc });
  saveAllData();
  addNotification('Expense claim submitted: Rs.' + amount.toLocaleString('en-IN'), 'expense');
  showToast('Expense claim submitted');
  renderExpenseOverlay();
}
function approveExpense(id) {
  const exp = expenseReimbursements.find(e => e.id === id);
  if (exp) { exp.status = 'Approved'; exp.approvedBy = currentUser.code; exp.approvedOn = new Date().toISOString().split('T')[0]; apiCall('PUT', '/expenses/' + id + '/approve', {}); saveAllData(); renderExpenseOverlay(); showToast('Expense approved'); }
}
function rejectExpense(id) {
  const exp = expenseReimbursements.find(e => e.id === id);
  if (exp) { exp.status = 'Rejected'; exp.rejectedBy = currentUser.code; apiCall('PUT', '/expenses/' + id + '/reject', {}); saveAllData(); renderExpenseOverlay(); showToast('Expense rejected'); }
}
function renderExpenseOverlay() {
  const c = document.getElementById('expensesContent');
  if (!c) return;
  const isMdHr = currentUser && (currentUser.role === 'MD' || currentUser.role === 'HR');
  let html = '<div style="display:flex;gap:8px;margin-bottom:12px"><button class="nf-btn nf-btn-primary" onclick="openExpenseApplyForm()">+ New Claim</button></div>';
  const myExps = isMdHr ? expenseReimbursements : expenseReimbursements.filter(e => e.empCode === currentUser.code);
  if (myExps.length === 0) {
    html += '<div class="nf-empty">No expense claims yet</div>';
  } else {
    myExps.sort((a,b) => b.id - a.id).forEach(exp => {
      const badgeCls = exp.status === 'Approved' ? 'badge-approved' : exp.status === 'Rejected' ? 'badge-rejected' : 'badge-pending';
      const catIcons = {'Travel':'🚗','Food':'🍽️','Accommodation':'🏨','Equipment':'🔧','Office Supplies':'📎','Medical':'🏥','Fuel':'⛽','Other':'📦'};
      html += `<div class="expense-item"><div class="expense-cat-icon" style="background:var(--gray-100)">${catIcons[exp.category]||'📦'}</div><div style="flex:1"><div style="font-weight:600;font-size:.82rem">${escapeHTML(exp.category)}</div><div style="font-size:.72rem;color:var(--gray-500)">${escapeHTML(exp.empName)} &middot; ${exp.date}</div>${exp.description?'<div style="font-size:.68rem;color:var(--gray-400);margin-top:2px">'+escapeHTML(exp.description)+'</div>':''}</div><div style="text-align:right"><div class="expense-amount">Rs.${exp.amount.toLocaleString('en-IN')}</div><span class="badge-status ${badgeCls}">${exp.status}</span>`;
      if (isMdHr && exp.status === 'Pending') {
        html += `<div style="margin-top:4px;display:flex;gap:4px"><button class="nf-btn nf-btn-success nf-btn-sm" onclick="approveExpense(${exp.id})" aria-label="Approve expense ${exp.id}">✓</button><button class="nf-btn nf-btn-danger nf-btn-sm" onclick="rejectExpense(${exp.id})" aria-label="Reject expense ${exp.id}">✗</button></div>`;
      }
      html += '</div></div>';
    });
  }
  c.innerHTML = html;
}
function openExpenseApplyForm() {
  const c = document.getElementById('expensesContent');
  let html = '<div class="card" style="margin-bottom:12px"><h3 style="font-family:var(--font-display);font-size:.95rem;font-weight:600;margin-bottom:12px">New Expense Claim</h3>';
  html += '<div class="ss-form-group"><label>Category *</label><select class="nf-select" id="expCategory"><option value="">Select</option>';
  EXPENSE_CATEGORIES.forEach(cat => html += `<option>${cat}</option>`);
  html += '</select></div>';
  html += '<div class="ss-form-group"><label>Amount (Rs.) *</label><input type="number" id="expAmount" placeholder="e.g. 5000"></div>';
  html += '<div class="ss-form-group"><label>Date *</label><input type="date" id="expDate" value="' + new Date().toISOString().split('T')[0] + '"></div>';
  html += '<div class="ss-form-group"><label>Description</label><textarea id="expDesc" rows="2" placeholder="Brief description..." style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:var(--radius-xs);font-family:var(--font-body);font-size:.82rem"></textarea></div>';
  html += '<div style="display:flex;gap:8px"><button class="nf-btn nf-btn-primary" onclick="submitExpenseReimbursement()">Submit Claim</button><button class="nf-btn nf-btn-outline" onclick="renderExpenseOverlay()">Cancel</button></div></div>';
  c.innerHTML = html;
}

// =====================================================
// F3: SELF SERVICE FUNCTIONS
// =====================================================
let currentSsTab = 'details';
function switchSsTab(tab) {
  currentSsTab = tab;
  document.querySelectorAll('#ssTabs .ss-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`#ssTabs .ss-tab:nth-child(${tab==='details'?1:tab==='documents'?2:3})`).classList.add('active');
  renderSelfServiceOverlay();
}
function updatePersonalDetails() {
  const phone = document.getElementById('ssPhone').value.trim();
  const address = document.getElementById('ssAddress').value.trim();
  const emergency = document.getElementById('ssEmergency').value.trim();
  if (!employeeSelfData[currentUser.code]) employeeSelfData[currentUser.code] = {};
  Object.assign(employeeSelfData[currentUser.code], { phone, address, emergencyContact: emergency });
  saveAllData();
  showToast('Personal details updated');
}
function renderSelfServiceOverlay() {
  const c = document.getElementById('selfServiceContent');
  if (!c || !currentUser) return;
  const selfData = employeeSelfData[currentUser.code] || {};
  let html = '';
  if (currentSsTab === 'details') {
    html = '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Personal Information</div>';
    html += `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><div class="avatar-sm" style="width:48px;height:48px;font-size:1rem">${escapeHTML(currentUser.name.charAt(0))}</div><div><div style="font-weight:600">${escapeHTML(currentUser.name)}</div><div style="font-size:.75rem;color:var(--gray-500)">${escapeHTML(currentUser.code)} &middot; ${escapeHTML(currentUser.designation)}</div></div></div>`;
    html += `<div class="ss-form-group"><label>Phone</label><input type="tel" id="ssPhone" value="${escapeHTML(selfData.phone||currentUser.phone||'')}" placeholder="Mobile number"></div>`;
    html += `<div class="ss-form-group"><label>Address</label><textarea id="ssAddress" rows="2" placeholder="Current address">${escapeHTML(selfData.address||'')}</textarea></div>`;
    html += `<div class="ss-form-group"><label>Emergency Contact</label><input type="text" id="ssEmergency" value="${escapeHTML(selfData.emergencyContact||'')}" placeholder="Name - Phone"></div>`;
    html += `<button class="nf-btn nf-btn-primary" onclick="updatePersonalDetails()">Save Changes</button></div>`;
  } else if (currentSsTab === 'documents') {
    const docs = selfData.uploadedDocs || [];
    html = '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Uploaded Documents</div>';
    if (docs.length === 0) html += '<div class="nf-empty">No documents uploaded yet</div>';
    docs.forEach(d => {
      html += `<div class="ss-doc-item"><div><div style="font-weight:600;font-size:.82rem">${escapeHTML(d.name)}</div><div style="font-size:.7rem;color:var(--gray-500)">${escapeHTML(d.type)} &middot; ${d.date}</div></div><span class="badge-status badge-approved">Uploaded</span></div>`;
    });
    html += '<div style="margin-top:12px"><button class="nf-btn nf-btn-outline" onclick="uploadSelfDocument()">+ Upload Document</button></div></div>';
  } else {
    html = '<div class="card" style="margin-bottom:12px"><div class="nf-section-title">Download Center</div>';
    html += `<div class="ss-doc-item"><div><div style="font-weight:600;font-size:.82rem">Latest Salary Slip</div><div style="font-size:.7rem;color:var(--gray-500)">Current month payslip PDF</div></div><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="switchTab('salary',document.querySelector('[data-tab=salary]'));hideOverlay('self-service')">View</button></div>`;
    html += `<div class="ss-doc-item"><div><div style="font-weight:600;font-size:.82rem">Employee ID Card</div><div style="font-size:.7rem;color:var(--gray-500)">Download ID card PDF</div></div><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="if(typeof generateIdCardPDF==='function')generateIdCardPDF()">Download</button></div>`;
    html += `<div class="ss-doc-item"><div><div style="font-weight:600;font-size:.82rem">Form 16</div><div style="font-size:.7rem;color:var(--gray-500)">Tax certificate PDF</div></div><button class="nf-btn nf-btn-primary nf-btn-sm" onclick="showOverlay('hr-tax');hideOverlay('self-service')">View</button></div>`;
    html += '</div>';
  }
  c.innerHTML = html;
}
function uploadSelfDocument() {
  const docType = prompt('Document type (e.g. Aadhaar, PAN, Photo):');
  if (!docType) return;
  if (!employeeSelfData[currentUser.code]) employeeSelfData[currentUser.code] = {};
  if (!employeeSelfData[currentUser.code].uploadedDocs) employeeSelfData[currentUser.code].uploadedDocs = [];
  employeeSelfData[currentUser.code].uploadedDocs.push({ name: docType, type: 'Identity', date: new Date().toISOString().split('T')[0] });
  saveAllData();
  showToast('Document uploaded (mock)');
  renderSelfServiceOverlay();
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
  for (const loc of SITE_LOCATIONS) {
    const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (dist <= loc.radius) return { inside: true, location: loc.name, distance: Math.round(dist) };
  }
  return { inside: false, location: null, distance: null };
}
function getGeofenceStatusHTML() {
  // Mock coordinates near Head Office
  const mockLat = 11.0850 + (Math.random() - 0.5) * 0.002;
  const mockLng = 76.9960 + (Math.random() - 0.5) * 0.002;
  const result = checkGeofence(mockLat, mockLng);
  if (result.inside) {
    return `<span class="geofence-status geofence-inside">📍 ${result.location} (${result.distance}m)</span>`;
  }
  return '<span class="geofence-status geofence-outside">⚠ Outside geofence</span>';
}
function getAttendanceStatus(checkInTime) {
  if (!checkInTime) return '';
  const parts = checkInTime.split(':');
  const hour = parseInt(parts[0], 10), min = parseInt(parts[1], 10);
  const totalMin = hour * 60 + min;
  if (totalMin > 9 * 60 + 15) return '<span class="log-late" style="font-size:.7rem"> (Late)</span>';
  return '<span style="font-size:.7rem;color:var(--success)"> (On-time)</span>';
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
// F5: FORM 16 / TAX FUNCTIONS
// =====================================================
let currentTaxTab = 'declaration';
function switchTaxTab(tab) {
  currentTaxTab = tab;
  document.querySelectorAll('#taxTabs .tax-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`#taxTabs .tax-tab:nth-child(${tab==='declaration'?1:tab==='summary'?2:3})`).classList.add('active');
  renderTaxOverlay();
}
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
function submitTaxDeclaration() {
  if (!currentUser) return;
  const sec80C = parseFloat(document.getElementById('tax80C').value) || 0;
  const sec80D = parseFloat(document.getElementById('tax80D').value) || 0;
  const hra = parseFloat(document.getElementById('taxHRA').value) || 0;
  const homeLoan = parseFloat(document.getElementById('taxHomeLoan').value) || 0;
  taxDeclarations[currentUser.code] = { sec80C, sec80D, hra, homeLoan, submittedOn: new Date().toISOString().split('T')[0] };
  const taxCalc = calculateTaxLiability(currentUser.code);
  apiCall('POST', '/tax', { fy: '2025-26', section_80c: sec80C, section_80d: sec80D, hra_exemption: hra, home_loan_interest: homeLoan, annual_income: taxCalc ? taxCalc.annual : 0, total_deductions: taxCalc ? taxCalc.totalDeductions : 0, taxable_income: taxCalc ? taxCalc.taxable : 0, tax_liability: taxCalc ? taxCalc.taxWithCess : 0, monthly_tds: taxCalc ? taxCalc.monthlyTDS : 0 });
  saveAllData();
  showToast('Tax declaration submitted');
  switchTaxTab('summary');
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
  const c = document.getElementById('taxContent');
  if (!c || !currentUser) return;
  const dec = taxDeclarations[currentUser.code] || {};
  let html = '';
  if (currentTaxTab === 'declaration') {
    html = '<div class="card"><div class="nf-section-title">IT Declaration FY 2025-26</div>';
    html += `<div class="ss-form-group"><label>Section 80C (Max Rs.1,50,000)</label><input type="number" class="tax-input" id="tax80C" value="${dec.sec80C||''}" placeholder="PPF, LIC, ELSS, etc."></div>`;
    html += `<div class="ss-form-group"><label>Section 80D — Medical Insurance (Max Rs.25,000)</label><input type="number" class="tax-input" id="tax80D" value="${dec.sec80D||''}" placeholder="Health insurance premium"></div>`;
    html += `<div class="ss-form-group"><label>HRA Exemption</label><input type="number" class="tax-input" id="taxHRA" value="${dec.hra||''}" placeholder="Monthly rent paid"></div>`;
    html += `<div class="ss-form-group"><label>Home Loan Interest (Sec 24)</label><input type="number" class="tax-input" id="taxHomeLoan" value="${dec.homeLoan||''}" placeholder="Annual interest"></div>`;
    html += `<button class="nf-btn nf-btn-primary" onclick="submitTaxDeclaration()">Submit Declaration</button>`;
    if (dec.submittedOn) html += `<div style="font-size:.72rem;color:var(--success);margin-top:8px">Last submitted: ${dec.submittedOn}</div>`;
    html += '</div>';
  } else if (currentTaxTab === 'summary') {
    const tax = calculateTaxLiability(currentUser.code);
    html = '<div class="card"><div class="nf-section-title">Tax Computation Summary</div>';
    if (tax) {
      const rows = [
        ['Annual Gross Salary', tax.annualGross], ['(-) Standard Deduction', tax.stdDeduction],
        ['(-) Section 80C', tax.sec80C], ['(-) Section 80D', tax.sec80D], ['(-) HRA Exemption', tax.hra],
        ['Total Deductions', tax.totalDeductions], ['Taxable Income', tax.taxableIncome],
        ['Income Tax', tax.tax], ['Cess (4%)', tax.cess]
      ];
      rows.forEach(r => {
        html += `<div class="tax-summary-row"><span>${r[0]}</span><span>Rs.${r[1].toLocaleString('en-IN')}</span></div>`;
      });
      html += `<div class="tax-summary-row total"><span>Total Tax Liability</span><span>Rs.${tax.totalTax.toLocaleString('en-IN')}</span></div>`;
      html += `<div style="margin-top:8px;font-size:.78rem;color:var(--gray-500)">Monthly TDS: Rs.${tax.monthlyTds.toLocaleString('en-IN')}</div>`;
    } else {
      html += '<div class="nf-empty">Unable to compute tax</div>';
    }
    html += '</div>';
  } else {
    html = '<div class="card" style="text-align:center;padding:24px"><div class="nf-section-title">Form 16 — AY 2026-27</div>';
    html += `<p style="font-size:.82rem;color:var(--gray-500);margin-bottom:12px">Download your Form 16 certificate for Assessment Year 2026-27</p>`;
    html += `<button class="nf-btn nf-btn-primary" onclick="generateForm16PDF()">📄 Download Form 16 PDF</button></div>`;
  }
  c.innerHTML = html;
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
  saveAllData();
}
function markFiled(id) {
  const f = complianceFilings.find(c => c.id === id);
  if (f) { f.status = 'Filed'; f.filedOn = new Date().toISOString().split('T')[0]; apiCall('PUT', '/compliance/filings/' + id + '/mark-filed', {}); saveAllData(); renderComplianceOverlay(); showToast('Marked as filed'); }
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
function addContractWorker() {
  const name = prompt('Contract worker name:');
  if (!name) return;
  const contractor = prompt('Contractor name:');
  contractWorkers.push({
    id: contractWorkerNextId++, name, contractor: contractor || 'Self',
    startDate: new Date().toISOString().split('T')[0], status: 'Active', dept: 'Site'
  });
  saveAllData();
  renderComplianceOverlay();
  showToast('Contract worker added');
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
function saveAsset() {
  const name = document.getElementById('assetName').value.trim();
  const type = document.getElementById('assetType').value;
  if (!name || !type) { showToast('Name and type are required'); return; }
  assetInventory.push({
    id: assetNextId++, name, type,
    serial: document.getElementById('assetSerial').value.trim(),
    purchaseDate: document.getElementById('assetDate').value,
    cost: parseFloat(document.getElementById('assetCost').value) || 0,
    condition: document.getElementById('assetCondition').value,
    assignedTo: null, assignedDate: null
  });
  apiCall('POST', '/assets', { asset_name: name, asset_type: type, serial_no: document.getElementById('assetSerial').value.trim(), purchase_date: document.getElementById('assetDate').value, purchase_cost: parseFloat(document.getElementById('assetCost').value) || 0, asset_condition: document.getElementById('assetCondition').value });
  saveAllData();
  showToast('Asset added');
  renderAssetsOverlay();
}
function assignAsset(id, empCode) {
  if (!empCode) { showToast('Select an employee'); return; }
  const asset = assetInventory.find(a => a.id === id);
  if (asset) { asset.assignedTo = empCode; asset.assignedDate = new Date().toISOString().split('T')[0]; apiCall('PUT', '/assets/' + id + '/assign', { emp_code: empCode }); saveAllData(); renderAssetsOverlay(); showToast('Asset assigned'); }
}
function returnAsset(id) {
  const asset = assetInventory.find(a => a.id === id);
  if (asset) { asset.assignedTo = null; asset.assignedDate = null; apiCall('PUT', '/assets/' + id + '/return', {}); saveAllData(); renderAssetsOverlay(); showToast('Asset returned'); }
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
function submitResignation() {
  const reason = document.getElementById('exitReason').value;
  if (!reason) { showToast('Please select a reason'); return; }
  const noticePeriod = NOTICE_PERIODS[currentUser.role] || 30;
  const lwd = document.getElementById('exitLwd').value || (() => { const d = new Date(); d.setDate(d.getDate() + noticePeriod); return d.toISOString().split('T')[0]; })();
  exitRequests.push({
    id: exitNextId++, empCode: currentUser.code, reason, lwd,
    remarks: document.getElementById('exitRemarks').value.trim(),
    noticePeriod, appliedOn: new Date().toISOString().split('T')[0],
    status: 'Pending', clearance: {}
  });
  apiCall('POST', '/exit', { reason, remarks: document.getElementById('exitRemarks').value.trim(), preferred_lwd: lwd });
  saveAllData();
  addNotification(currentUser.name + ' has submitted resignation', 'exit');
  showToast('Resignation submitted');
  renderExitOverlay();
}
function approveExit(id) {
  const req = exitRequests.find(e => e.id === id);
  if (req) { req.status = 'Approved'; req.approvedBy = currentUser.code; req.approvedOn = new Date().toISOString().split('T')[0]; apiCall('PUT', '/exit/' + id + '/approve', {}); saveAllData(); renderExitOverlay(); showToast('Exit approved'); }
}
function rejectExit(id) {
  const req = exitRequests.find(e => e.id === id);
  if (req) { req.status = 'Rejected'; apiCall('PUT', '/exit/' + id + '/reject', {}); saveAllData(); renderExitOverlay(); showToast('Exit rejected'); }
}
function updateClearance(exitId, dept) {
  const req = exitRequests.find(e => e.id === exitId);
  if (req) {
    if (!req.clearance) req.clearance = {};
    req.clearance[dept] = !req.clearance[dept];
    saveAllData();
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
  const unusedLeaves = (leaveBalance.casual || 0) + (leaveBalance.earned || 0);
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
  if (COMPANY_LOGO_B64) { try { doc.addImage('data:image/png;base64,' + COMPANY_LOGO_B64, 'PNG', 20, y-5, 15, 15); } catch(e){} }
  doc.setFontSize(12); doc.setFont('Helvetica','bold');
  doc.text(COMPANY_NAME, 40, y); y += 5;
  doc.setFontSize(8); doc.setFont('Helvetica','normal');
  doc.text(COMPANY_ADDRESS, 40, y); y += 10;
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
function completeExit(id) {
  if (!confirm('Mark this exit as completed? This action cannot be undone.')) return;
  const req = exitRequests.find(e => e.id === id);
  if (req) { req.status = 'Completed'; req.completedOn = new Date().toISOString().split('T')[0]; apiCall('PUT', '/exit/' + id + '/complete', { fnf_amount: 0 }); saveAllData(); renderExitOverlay(); showToast('Exit completed'); }
}

// =====================================================
// F9: ORG CHART FUNCTIONS
// =====================================================
function buildOrgTree(empCode) {
  const emp = EMPLOYEES.find(e => e.code === empCode);
  if (!emp) return null;
  const node = { emp, children: [] };
  const map = REPORTING_MAP[empCode];
  if (map && map.reports) {
    map.reports.forEach(childCode => {
      const child = buildOrgTree(childCode);
      if (child) node.children.push(child);
    });
  }
  return node;
}
function renderOrgNode(node, depth) {
  if (!node) return '';
  const cls = node.emp.role === 'MD' ? ' md' : '';
  let html = `<div class="org-branch"><div class="org-node${cls}" onclick="showOrgDetail('${escapeAttr(node.emp.code)}')"><div class="org-name">${escapeHTML(node.emp.name)}</div><div class="org-desg">${escapeHTML(node.emp.designation)}</div></div>`;
  if (node.children.length > 0 && depth < 3) {
    html += '<div class="org-connector"></div><div class="org-children">';
    node.children.forEach(child => { html += renderOrgNode(child, depth + 1); });
    html += '</div>';
  } else if (node.children.length > 0) {
    html += `<div style="font-size:.65rem;color:var(--gray-400);margin-top:4px">+${node.children.length} reports</div>`;
  }
  html += '</div>';
  return html;
}
function showOrgDetail(empCode) {
  const emp = EMPLOYEES.find(e => e.code === empCode);
  if (!emp) return;
  const reports = REPORTING_MAP[empCode] ? REPORTING_MAP[empCode].reports.length : 0;
  const reportsTo = Object.keys(REPORTING_MAP).find(k => REPORTING_MAP[k].reports && REPORTING_MAP[k].reports.includes(empCode));
  const manager = reportsTo ? EMPLOYEES.find(e => e.code === reportsTo) : null;
  alert(`${emp.name}\n${emp.designation} — ${emp.dept}\nCode: ${emp.code}\nDOJ: ${emp.doj}\nReports to: ${manager ? manager.name : 'Board'}\nDirect reports: ${reports}`);
}
function renderOrgchartOverlay() {
  const c = document.getElementById('orgchartContent');
  if (!c) return;
  const tree = buildOrgTree('MD001');
  if (!tree) { c.innerHTML = '<div class="nf-empty">Unable to build org chart</div>'; return; }
  // Also add Garden head (SSG003) who reports directly
  let html = '<div class="org-tree">';
  html += renderOrgNode(tree, 0);
  // Garden branch
  const gardenTree = buildOrgTree('SSG003');
  if (gardenTree) {
    html += '<div style="margin-top:16px"><div class="nf-section-title">Garden & Security</div>';
    html += renderOrgNode(gardenTree, 0);
    html += '</div>';
  }
  html += '</div>';
  c.innerHTML = html;
}

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
  apiCall('POST', '/announcements/' + id + '/read', {});
  saveAllData();
}
function createAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const body = document.getElementById('annBody').value.trim();
  const category = document.getElementById('annCategory').value;
  const priority = document.getElementById('annPriority').value;
  if (!title || !body) { showToast('Title and body are required'); return; }
  announcements.push({
    id: announcementNextId++, title, body, category, priority,
    author: currentUser.code, date: new Date().toISOString().split('T')[0]
  });
  apiCall('POST', '/announcements', { title, content: body, category, priority });
  saveAllData();
  addNotification('New announcement: ' + title, 'announcement');
  showToast('Announcement published');
  renderAnnouncementsOverlay();
}
function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  const idx = announcements.findIndex(a => a.id === id);
  if (idx >= 0) { announcements.splice(idx, 1); apiCall('DELETE', '/announcements/' + id, {}); saveAllData(); renderAnnouncementsOverlay(); showToast('Announcement deleted'); }
}
function renderAnnouncementDashboard() {
  const el = document.getElementById('dashboardAnnouncements');
  if (!el || !currentUser) return;
  const unread = announcements.filter(a => !announcementReadStatus[currentUser.code + '_' + a.id]).slice(0, 3);
  if (unread.length === 0) { el.innerHTML = ''; return; }
  let html = '<div class="section-title">Announcements</div><div class="dashboard-announcements">';
  unread.forEach(a => {
    html += `<div class="dashboard-announce-item" onclick="markAnnouncementRead(${a.id});showOverlay('hr-announcements')"><h4>${escapeHTML(a.title)}</h4><p>${a.date} &middot; ${escapeHTML(a.category)}</p></div>`;
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
    announcements.sort((a,b) => b.id - a.id).forEach(a => {
      const isRead = announcementReadStatus[currentUser.code + '_' + a.id];
      const catCls = 'announce-' + (a.category||'general').toLowerCase().replace(/ /g,'-').replace('policy-update','policy');
      const author = EMPLOYEES.find(e => e.code === a.author);
      html += `<div class="announcement-card ${isRead?'read':'unread'}" onclick="markAnnouncementRead(${a.id})"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px"><span class="announcement-cat ${catCls}">${escapeHTML(a.category)}</span><span style="font-size:.68rem;color:var(--gray-400)">${a.date}</span></div><div style="font-weight:600;font-size:.88rem;margin-bottom:4px">${escapeHTML(a.title)}</div><div style="font-size:.78rem;color:var(--gray-600);margin-bottom:6px">${escapeHTML(a.body)}</div><div style="font-size:.68rem;color:var(--gray-400)">By ${author?escapeHTML(author.name):'Admin'}`;
      if (isMdHr) html += ` <button class="nf-btn nf-btn-danger nf-btn-sm" style="margin-left:8px;padding:2px 8px;font-size:.65rem" onclick="event.stopPropagation();deleteAnnouncement(${a.id})">Delete</button>`;
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
// INITIALIZATION — LOAD DATA & AUTO-LOGIN
// =====================================================
(async function initApp() {
  initDarkMode();
  loadAllData();
  MOCK_BACKEND.init();
  // Restore JWT if available
  JWT_TOKEN = safeStorage.get('hrms_jwt') || null;

  // Check for Google OAuth2 redirect (token in sessionStorage or URL hash)
  const _hasGoogleToken = sessionStorage.getItem('hrms_google_token') || (location.hash && location.hash.includes('access_token'));
  if (_hasGoogleToken) {
    // Show loading state while processing Google login
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.textContent = 'Signing in with Google...';
    const btn = document.getElementById('googleSignInBtn');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Signing in...'; }
    try {
      await _handleGoogleRedirect();
    } catch (e) {
      if (errEl) errEl.textContent = 'Google Sign-In failed. Please try again.';
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Sign in with Google'; }
    }
  } else if (!tryAutoLogin()) {
    // Show login screen (default state)
  } else {
    resetIdleTimer();
    restoreNotifPrefToggles();
    renderNotifications();
    updateNotifBadge();
    // Try to seed backend data if online
    setTimeout(seedBackendData, 2000);
    syncOfflineQueue();
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
  // Demo buttons
  document.querySelectorAll('.demo-btn[data-demo]').forEach(function(btn) {
    btn.addEventListener('click', function() { demoLogin(btn.getAttribute('data-demo')); });
  });
})();
