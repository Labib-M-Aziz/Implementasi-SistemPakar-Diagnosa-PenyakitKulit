class InferenceEngine {
    constructor(rules) {
        this.rules = rules;
        this.facts = {};
        this.firedRules = new Set(); 
    }

    _cfCombine(cf1, cf2) {
        // Rumus CF Paralel (CFcombine)
        if (cf1 > 0 && cf2 > 0) {
            return cf1 + cf2 * (1 - cf1);
        } else if (cf1 < 0 && cf2 < 0) {
            return cf1 + cf2 * (1 + cf1);
        } else {
            return (cf1 + cf2) / (1 - Math.min(Math.abs(cf1), Math.abs(cf2)));
        }
    }

    _cfSequential(cfRule, cfPremise) {
        // Rumus CF Sekuensial (CFgabungan)
        return cfRule * cfPremise;
    }

    run(initialFactsWithCF) {
        // 1. Inisialisasi fakta awal dari user
        this.facts = { ...initialFactsWithCF };
        // Reset pelacak aturan setiap kali 'run' dipanggil
        this.firedRules.clear(); 
        
        let newFactAdded = true;
        let iterations = 0;

        // 2. Loop Forward Chaining
        while (newFactAdded) {
            newFactAdded = false;
            iterations++;

            if (iterations > 100) { // Pengaman darurat
                console.error("Infinite loop terdeteksi!");
                break;
            }

            for (const rule of this.rules) {
                const { id: ruleId, if: premises, then: conclusion, cf: cfRule } = rule;

                // Periksa apakah aturan ini sudah dieksekusi
                if (this.firedRules.has(ruleId)) {
                    continue;
                }

                let premisesMet = true;
                let minCfPremise = 1.0; 

                for (const premise of premises) {
                    if (this.facts[premise] === undefined) {
                        premisesMet = false;
                        break;
                    } else {
                        minCfPremise = Math.min(minCfPremise, this.facts[premise]);
                    }
                }
                
                if (premisesMet) {
                    const cfNewFact = this._cfSequential(cfRule, minCfPremise);
                    
                    console.log(`[Inferensi] Iterasi ${iterations}: Aturan ${ruleId} dieksekusi. Fakta baru: ${conclusion} (CF: ${cfNewFact.toFixed(4)})`);

                    const existingCf = this.facts[conclusion] || 0.0;
                    
                    let finalCf;
                    if (existingCf !== 0.0) {
                        // Ini adalah aturan PARALEL
                        finalCf = this._cfCombine(existingCf, cfNewFact);
                        console.log(`  -> [Paralel] Menggabungkan ${conclusion}. HASIL: ${finalCf.toFixed(4)}`);
                    } else {
                        // Ini fakta baru
                        finalCf = cfNewFact;
                    }
                    
                    // Hanya set 'newFactAdded' jika nilainya benar-benar berubah
                    if (this.facts[conclusion] !== finalCf) {
                        this.facts[conclusion] = finalCf;
                        newFactAdded = true;
                    }
                    
                    // Tandai aturan ini sudah dieksekusi
                    this.firedRules.add(ruleId);
                }
            } 
        } 

        // 9. Selesai, kembalikan semua fakta penyakit (yang diawali 'P')
        const results = {};
        for (const factCode in this.facts) {
            if (factCode.startsWith('P')) {
                results[factCode] = this.facts[factCode];
            }
        }
        return results;
    }
}