const typeTranslations = {
    "normal": "ノーマル",
    "fire": "ほのお",
    "water": "みず",
    "electric": "でんき",
    "grass": "くさ",
    "ice": "こおり",
    "fighting": "かくとう",
    "poison": "どく",
    "ground": "じめん",
    "flying": "ひこう",
    "psychic": "エスパー",
    "bug": "むし",
    "rock": "いわ",
    "ghost": "ゴースト",
    "dragon": "ドラゴン",
    "dark": "あく",
    "steel": "はがね",
    "fairy": "フェアリー"
};

function fetchPokemonNameInJapanese(url) {
    return fetch(url)
        .then(response => response.json())
        .then(data => data.names.find(name => name.language.name === "ja").name)
        .catch(error => console.error("ポケモン名の取得中のエラー: ", error));
}

function showLoading() {
    document.getElementById('overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('overlay').style.display = 'none';
}

function fetchAndTranslateType(pokemonId) {
    return new Promise((resolve, reject) => {
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
            .then(response => response.json())
            .then(data => {
                const types = data.types.map(typeInfo => typeTranslations[typeInfo.type.name]).join(", ");
                document.getElementById('type').textContent = types;
                resolve();  // Promiseを解決
                console.log("タイプ情報の取得に成功しました");
            })
            .catch(error => {
                console.error("タイプ情報取得中のエラー: ", error);
                reject(error);  // Promiseを拒否
            });
    });
}

function fetchAndDisplayEvolution(pokemonId) {
    return new Promise((resolve, reject) => {
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
        .then(response => response.json())
        .then(data => {
            const evolutionChainUrl = data.evolution_chain.url;
            return fetch(evolutionChainUrl);
        })
        .then(response => response.json())
        .then(evolutionData => {
            let evolutionPromises = [];
            evolutionPromises.push(fetchPokemonNameInJapanese(evolutionData.chain.species.url));

            if (evolutionData.chain.evolves_to.length > 0) {
                evolutionPromises.push(fetchPokemonNameInJapanese(evolutionData.chain.evolves_to[0].species.url));

                if (evolutionData.chain.evolves_to[0].evolves_to.length > 0) {
                    evolutionPromises.push(fetchPokemonNameInJapanese(evolutionData.chain.evolves_to[0].evolves_to[0].species.url));
                }
            }

            return Promise.all(evolutionPromises);
        })
        .then(evolutionNames => {
            // 進化情報の文字列を組み立てて表示
            document.getElementById('evolution').textContent = evolutionNames.join(" → ");
            resolve();
        })
        .catch(error => {
            console.error("進化情報の取得中のエラー: ", error);
            reject(error);
        });
    });
}


let pokemonId = 0;

document.getElementById('load-pokemon').addEventListener('click', function() {
    showLoading();
    // ランダムなIDを生成
    pokemonId = Math.floor(Math.random() * 1024) + 1;

    // ポケモンの基本情報を取得
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
        .then(response => response.json())
        .then(data => {
            // ポケモンの名前
            try {
                document.getElementById('name').textContent = data.names.find(name => name.language.name === "ja").name;
            } catch (error) {
                document.getElementById('name').textContent = '???';
            }
            // 分類
            try {
                document.getElementById('classification').textContent = data.genera.find(genus => genus.language.name === "ja").genus;
            } catch (error) {
                document.getElementById('classification').textContent = '???';
            }
            // 図鑑説明
            try {
                document.getElementById('description').textContent = data.flavor_text_entries.find(entry => entry.language.name === "ja").flavor_text;
            } catch (error) {
                document.getElementById('description').textContent = '???';
            }

            return Promise.all([
                fetchAndDisplayEvolution(pokemonId),
                fetchAndTranslateType(pokemonId)
            ])
            .then(() => {
                hideLoading(); // すべての非同期処理が完了した後に非表示にする
            })
            .catch(error => {
                console.error("エラー: ", error);
                hideLoading(); // エラー時にも非表示にする
            });
        })
});

function openZukan() {
    if (pokemonId > 0) {
        // 4桁になるように0埋め
        const pokemonIdStr = pokemonId.toString().padStart(4, '0');
        window.open(`https://zukan.pokemon.co.jp/detail/${pokemonIdStr}`, '_blank');
    } else {
        alert('まずはポケモンを読み込んでください！');
    }
}

// zukanボタンのイベントリスナーを設定
const zukanButton = document.getElementById('zukan');
zukanButton.removeEventListener('click', openZukan); // 既存のリスナーを削除
zukanButton.addEventListener('click', openZukan); // 新しいリスナーを追加

// 各情報の表示・非表示の切り替え
document.querySelectorAll('#pokemon-info > .card-body > .card-text').forEach(element => {
    element.classList.add('masked'); // 初期状態でマスクを適用
    element.addEventListener('click', function() {
        this.classList.toggle('visible');
        this.classList.toggle('masked');
    });
});

document.getElementById('unmask-all').addEventListener('click', function() {
    document.querySelectorAll('#pokemon-info > .card-body > .card-text').forEach(element => {
        element.classList.add('visible');  // 表示
        element.classList.remove('masked'); // マスクを解除
    });
});

document.getElementById('mask-all').addEventListener('click', function() {
    document.querySelectorAll('#pokemon-info > .card-body > .card-text').forEach(element => {
        element.classList.remove('visible'); // 非表示
        element.classList.add('masked');     // マスクを適用
    });
});
