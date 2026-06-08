/* ==========================================================================
   ECOLOGY DEMOGRAPHY SUITE — DYNAMIC ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State variables ---
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide-section');
    const totalSlides = slides.length;
    const isSlideMode = () => document.body.classList.contains('slide-mode');
    
    // --- DOM Elements ---
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const progressBar = document.getElementById('progressBar');
    const currentSlideNum = document.getElementById('currentSlideNum');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const indicatorDots = document.getElementById('indicatorDots');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    const btnSlideMode = document.getElementById('btnSlideMode');
    const btnDocMode = document.getElementById('btnDocMode');
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    
    // --- Age Intervals (5-year groupings) ---
    const ageIntervals = [
        "0", "1-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "61-65", "66-70", "71-75", "76-80", "81-85", "86-90", "91-95", "96-100", "101+"
    ];

    const cohortSize = 200; // Fixed n_0 size
    
    // --- Default Cohort Frequencies ---
    const defaultMaleDeathsA = [1, 2, 1, 1, 2, 4, 5, 6, 7, 8, 11, 13, 16, 22, 26, 28, 23, 14, 7, 2, 1, 0];
    const defaultFemaleDeathsA = [1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 29, 31, 25, 13, 4, 1, 0];
    
    const defaultMaleDeathsB = [1, 2, 1, 1, 3, 3, 4, 2, 8, 6, 7, 9, 21, 23, 54, 42, 4, 6, 3, 0, 0, 0];
    const defaultFemaleDeathsB = [2, 1, 1, 2, 1, 0, 3, 2, 3, 1, 4, 4, 21, 25, 61, 56, 9, 3, 1, 0, 0, 0];

    // --- State Object ---
    let activeCemetery = 'cemeteryA';
    let chartMode = 'cemeteryA'; // 'cemeteryA', 'cemeteryB', 'compare'
    let survivorshipChart = null;

    const cemeteries = {
        cemeteryA: {
            name: "St. John Memorial Park",
            location: "Col. Bonny Serrano Ave, San Juan City, 1504 Metro Manila)",
            date: "May 15, 2026",
            desc: "St. John Memorial Park is a modern cemetery serving families in San Juan City and nearby areas of Metro Manila. Established during the city's late-20th-century urban expansion, it departs from Spanish-colonial churchyard designs by featuring landscaped grounds, wider pathways, and modern burial facilities. Today, it stands as a serene, well-organized space for the growing population to practice the Filipino tradition of honoring loved ones, particularly during Undas.",
            photo: "assets/cemetery_entrance.png",
            maleDeaths: [...defaultMaleDeathsA],
            femaleDeaths: [...defaultFemaleDeathsA]
        },
        cemeteryB: {
            name: "City of San Jose Del Monte Public Cemetery",
            location: "R3W9+HFJ, SJDM, Bulacan)",
            date: "May 16, 2026",
            desc: "The City of San Jose del Monte (CSJDM) Public Cemetery (often called San Jose Cemetery Park) has a history deeply intertwined with the development of the city itself. Because it evolved from a traditional municipal burial ground into a modern city-managed park, there isn't a single definitive, widely published \"founding year\" for the original site.",
            photo: "assets/cemetery_entrance_2.png",
            maleDeaths: [...defaultMaleDeathsB],
            femaleDeaths: [...defaultFemaleDeathsB]
        }
    };

    /* ==========================================================================
       1. SLIDE NAVIGATION CORE ENGINE
       ========================================================================== */
    
    // Initialize Navigation Indicator Dots
    function initDots() {
        indicatorDots.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            indicatorDots.appendChild(dot);
        }
    }
    
    // Core slide transitions handler
    function goToSlide(index) {
        if (!isSlideMode()) return;
        
        // Boundaries safety
        if (index < 0 || index >= totalSlides) return;
        
        // Remove active states
        slides[currentSlide].classList.remove('active');
        navItems[currentSlide].classList.remove('active');
        
        const dots = indicatorDots.querySelectorAll('.dot');
        if (dots.length > currentSlide) {
            dots[currentSlide].classList.remove('active');
        }
        
        // Set new active slide
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        navItems[currentSlide].classList.add('active');
        
        if (dots.length > currentSlide) {
            dots[currentSlide].classList.add('active');
        }
        
        // Scroll active nav item in sidebar if needed
        navItems[currentSlide].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Update Slide count indicators
        currentSlideNum.textContent = currentSlide + 1;
        
        // Update Bottom buttons
        btnPrev.disabled = currentSlide === 0;
        btnNext.disabled = currentSlide === totalSlides - 1;
        if (currentSlide === totalSlides - 1) {
            btnNext.innerHTML = 'Finish <i class="fa-solid fa-circle-check"></i>';
        } else {
            btnNext.innerHTML = 'Next <i class="fa-solid fa-chevron-right"></i>';
        }
        
        // Update Progress Bar
        const percent = ((currentSlide) / (totalSlides - 1)) * 100;
        progressBar.style.width = `${percent}%`;
        
        // Trigger charts resize when opening chart slide
        if (currentSlide === 2 && survivorshipChart) {
            setTimeout(() => {
                survivorshipChart.resize();
                updateChartData(); // Ensure correct lines and sizes are shown
            }, 100);
        }
    }
    
    // Click events for sidebar navigation items
    navItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Next & Previous buttons
    btnPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
    btnNext.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    });
    
    // Keyboard keydown bindings
    document.addEventListener('keydown', (e) => {
        if (!isSlideMode()) return;
        
        // Avoid slide switching when editing input fields
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.getAttribute('contenteditable') === 'true') {
            if (e.key === 'Enter') {
                document.activeElement.blur();
            }
            return;
        }
        
        if (e.key === 'ArrowRight' || e.key === 'Space') {
            e.preventDefault();
            goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(currentSlide - 1);
        }
    });

    /* ==========================================================================
       2. VIEW MODE TOGGLE (SLIDE VS ACADEMIC DOCUMENT)
       ========================================================================== */
    
    function setViewMode(mode) {
        if (mode === 'slide') {
            document.body.classList.remove('doc-mode');
            document.body.classList.add('slide-mode');
            btnSlideMode.classList.add('active');
            btnDocMode.classList.remove('active');
            
            // Re-render and navigate to current slide
            slides.forEach(s => s.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            goToSlide(currentSlide);
        } else {
            document.body.classList.remove('slide-mode');
            document.body.classList.add('doc-mode');
            btnSlideMode.classList.remove('active');
            btnDocMode.classList.add('active');
            
            // Show all slides for scrolling
            slides.forEach(s => s.classList.add('active'));
            progressBar.style.width = '100%';
        }
        
        // Trigger chart redrawing for proper scaling
        if (survivorshipChart) {
            setTimeout(() => {
                survivorshipChart.resize();
                updateChartData();
            }, 150);
        }
    }
    
    btnSlideMode.addEventListener('click', () => setViewMode('slide'));
    btnDocMode.addEventListener('click', () => setViewMode('doc'));

    /* ==========================================================================
       3. DARK / LIGHT THEME CONTROLLER
       ========================================================================== */
    themeToggleBtn.addEventListener('click', () => {
        const body = document.body;
        const icon = themeToggleBtn.querySelector('i');
        
        if (body.classList.contains('theme-dark')) {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            icon.className = 'fa-solid fa-sun';
            themeToggleBtn.style.color = 'var(--accent-warning)';
        } else {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
            icon.className = 'fa-solid fa-moon';
            themeToggleBtn.style.color = 'var(--text-secondary)';
        }
        
        // Redraw chart to update colors based on styling variables
        if (survivorshipChart) {
            updateChartStyling();
        }
    });

    /* ==========================================================================
       4. MATHEMATICAL LIFE TABLE CALCULATOR ENGINE
       ========================================================================== */
    
    function calculateLifeTable(deaths) {
        const tableRows = [];
        let survivors = cohortSize; // n_0 = 200
        
        // First Pass: Calculate nx, lx, qx, Lx
        for (let i = 0; i < ageIntervals.length; i++) {
            const age = ageIntervals[i];
            const dx = Math.min(survivors, deaths[i] || 0); // deaths can't exceed remaining survivors
            const nx = survivors;
            const lx = nx / cohortSize;
            const qx = nx > 0 ? dx / nx : 0;
            
            // Next survivors
            const nextSurvivors = Math.max(0, survivors - dx);
            
            // L_x = average survivors in interval (simplified without width factor to match spreadsheet)
            const Lx = (nx + nextSurvivors) / 2;
            
            tableRows.push({
                age: age,
                dx: dx,
                nx: nx,
                lx: lx,
                qx: qx,
                Lx: Lx,
                Tx: 0, // Fill in second pass
                ex: 0  // Fill in second pass
            });
            
            survivors = nextSurvivors;
        }
        
        // Second Pass (Reverse): Calculate Tx and ex
        let runningT = 0;
        for (let i = tableRows.length - 1; i >= 0; i--) {
            runningT += tableRows[i].Lx;
            tableRows[i].Tx = runningT;
            tableRows[i].ex = tableRows[i].nx > 0 ? tableRows[i].Tx / tableRows[i].nx : 0;
        }
        
        return tableRows;
    }

    // Linearly interpolate median lifespan where lx is exactly 0.5
    function calculateMedianLifespan(rows) {
        for (let i = 0; i < rows.length - 1; i++) {
            const r1 = rows[i];
            const r2 = rows[i + 1];
            
            if (r1.lx >= 0.5 && r2.lx <= 0.5) {
                const age1 = i === 0 ? 0 : 5 * i - 4;
                const age2 = i === 0 ? 1 : 5 * i + 1;
                
                if (r1.lx === r2.lx) return age1;
                // Linear interpolation formula: age = age1 + (0.5 - lx1)/(lx2 - lx1) * (age2 - age1)
                const age = age1 + ((0.5 - r1.lx) / (r2.lx - r1.lx)) * (age2 - age1);
                return age.toFixed(1);
            }
        }
        // Fallback in case of extreme custom data where cohort doesn't die off
        if (rows[rows.length - 1].lx > 0.5) return "> 100";
        return "101+";
    }

    /* ==========================================================================
       5. TABLE DYNAMIC BUILDERS & INPUT HANDLERS
       ========================================================================== */
    
    function renderTable(gender, dataRows) {
        const tableBody = document.querySelector(`#${gender}Table tbody`);
        const totalDeathsSpan = document.getElementById(`${gender}TotalDeaths`);
        const validationMsg = document.getElementById(`${gender}ValidationMsg`);
        
        if (!tableBody) return;
        tableBody.innerHTML = '';
        let sumDeaths = 0;
        
        dataRows.forEach((row, i) => {
            sumDeaths += row.dx;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.age}</td>
                <td>
                    <input type="number" 
                           class="dx-input" 
                           data-gender="${gender}" 
                           data-index="${i}" 
                           value="${row.dx}" 
                           min="0" 
                           max="200"
                           step="1">
                </td>
                <td class="nx-col">${row.nx}</td>
                <td class="lx-col">${row.lx.toFixed(3)}</td>
                <td class="qx-col">${row.qx.toFixed(3)}</td>
                <td>${row.Lx.toFixed(1)}</td>
                <td>${row.Tx.toFixed(1)}</td>
                <td class="ex-col">${row.ex.toFixed(1)}</td>
            `;
            tableBody.appendChild(tr);
        });
        
        // Update sum display
        if (totalDeathsSpan) {
            totalDeathsSpan.textContent = sumDeaths;
        }
        
        // Validate if cohort sums to exactly 200
        if (validationMsg) {
            if (sumDeaths === cohortSize) {
                validationMsg.className = 'valid-status';
                validationMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Valid Cohort Size (200)';
            } else {
                validationMsg.className = 'invalid-status';
                validationMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error: Deaths must sum to 200 (Current: ${sumDeaths})`;
            }
        }
        
        // Add event listeners to input elements
        const inputs = tableBody.querySelectorAll('.dx-input');
        inputs.forEach(input => {
            input.addEventListener('change', handleInputChange);
            // Quick blur on enter
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
            });
        });
    }

    function handleInputChange(e) {
        const input = e.target;
        const gender = input.dataset.gender;
        const index = parseInt(input.dataset.index);
        let val = parseInt(input.value);
        
        // Numeric sanitization
        if (isNaN(val) || val < 0) val = 0;
        if (val > cohortSize) val = cohortSize;
        input.value = val;
        
        if (gender === 'male') {
            cemeteries[activeCemetery].maleDeaths[index] = val;
        } else {
            cemeteries[activeCemetery].femaleDeaths[index] = val;
        }
        
        // Recalculate metrics
        recalculateAndRefresh();
    }
    
    // Recalculates both datasets, updates tables, updates chart, and updates median displays
    function recalculateAndRefresh() {
        const maleRows = calculateLifeTable(cemeteries[activeCemetery].maleDeaths);
        const femaleRows = calculateLifeTable(cemeteries[activeCemetery].femaleDeaths);
        
        renderTable('male', maleRows);
        renderTable('female', femaleRows);
        
        // Update Chart
        if (survivorshipChart) {
            updateChartData();
        }
        
        // Auto-save to localStorage on recalculation
        saveCemeteriesToLocalStorage();
    }

    // Hook reset and clear buttons
    document.querySelectorAll('.reset-data-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gender = btn.dataset.gender;
            
            const defMale = activeCemetery === 'cemeteryA' ? defaultMaleDeathsA : defaultMaleDeathsB;
            const defFemale = activeCemetery === 'cemeteryA' ? defaultFemaleDeathsA : defaultFemaleDeathsB;

            if (gender === 'male') {
                cemeteries[activeCemetery].maleDeaths = [...defMale];
            } else {
                cemeteries[activeCemetery].femaleDeaths = [...defFemale];
            }
            recalculateAndRefresh();
        });
    });

    document.querySelectorAll('.clear-data-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gender = btn.dataset.gender;
            // Clear to all 0s, except index 14 (70-74) which holds 200 to keep it valid
            const cleared = Array(ageIntervals.length).fill(0);
            cleared[14] = 200; // default spike so it remains a valid cohort size
            
            if (gender === 'male') {
                cemeteries[activeCemetery].maleDeaths = cleared;
            } else {
                cemeteries[activeCemetery].femaleDeaths = cleared;
            }
            recalculateAndRefresh();
        });
    });

    /* ==========================================================================
       6. INTERACTIVE CHART.JS CONTROLLER & MULTI-LINE SUPPORT
       ========================================================================== */
    
    function initChart() {
        const ctx = document.getElementById('survivorshipChart').getContext('2d');
        if (!ctx) return;
        
        const isDark = document.body.classList.contains('theme-dark');
        const gridColor = isDark ? 'rgba(140, 125, 115, 0.18)' : 'rgba(92, 82, 76, 0.2)';
        const textColor = isDark ? '#baaea6' : '#5c524c';
        
        survivorshipChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ageIntervals,
                datasets: [] // populated dynamically in updateChartData
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: textColor,
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 11
                            },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#111827' : '#ffffff',
                        titleColor: isDark ? '#ffffff' : '#111827',
                        bodyColor: isDark ? '#d1d5db' : '#374151',
                        borderColor: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: {
                            family: "'Outfit', sans-serif",
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: "'Fira Code', monospace"
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                    label += ` (${Math.round(context.parsed.y * 2)} survivors)`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                            borderDash: [3, 3]
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 10
                            }
                        },
                        title: {
                            display: true,
                            text: 'Age Interval (years)',
                            color: textColor,
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 10
                        }
                    },
                    y: {
                        position: 'left',
                        min: 0,
                        max: 100,
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                            borderDash: [3, 3]
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: "'Fira Code', monospace",
                                size: 10
                            },
                            stepSize: 25,
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Survivorship (% Surviving)',
                            color: textColor,
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 10
                        }
                    }
                }
            }
        });

        updateChartData();
    }
    
    function updateChartData() {
        if (!survivorshipChart) return;
        
        const datasets = [];
        
        const maleRowsA = calculateLifeTable(cemeteries.cemeteryA.maleDeaths);
        const femaleRowsA = calculateLifeTable(cemeteries.cemeteryA.femaleDeaths);
        const maleRowsB = calculateLifeTable(cemeteries.cemeteryB.maleDeaths);
        const femaleRowsB = calculateLifeTable(cemeteries.cemeteryB.femaleDeaths);
        
        const nameA = cemeteries.cemeteryA.name;
        const nameB = cemeteries.cemeteryB.name;
        
        if (chartMode === 'cemeteryA' || chartMode === 'compare') {
            datasets.push({
                label: chartMode === 'compare' ? 'St. John Male % Surviving' : 'Male % Surviving',
                data: maleRowsA.map(r => r.lx * 100),
                borderColor: '#1d5f7a',
                backgroundColor: 'rgba(29, 95, 122, 0.03)',
                borderWidth: 2.5,
                pointBackgroundColor: '#1d5f7a',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 4.5,
                pointHoverRadius: 6,
                pointStyle: 'circle',
                tension: 0.25,
                fill: true
            });
            datasets.push({
                label: chartMode === 'compare' ? 'St. John Female % Surviving' : 'Female % Surviving',
                data: femaleRowsA.map(r => r.lx * 100),
                borderColor: '#853d85',
                backgroundColor: 'rgba(133, 61, 133, 0.03)',
                borderWidth: 2.5,
                pointBackgroundColor: '#853d85',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 5.5,
                pointHoverRadius: 7,
                pointStyle: 'rectRot',
                tension: 0.25,
                fill: true
            });
        }
        
        if (chartMode === 'cemeteryB' || chartMode === 'compare') {
            datasets.push({
                label: chartMode === 'compare' ? 'CSJDM Male Survivorship (%)' : 'Male Survivorship (%)',
                data: maleRowsB.map(r => r.lx * 100),
                borderColor: '#2980b9',
                backgroundColor: 'rgba(41, 128, 185, 0.03)',
                borderWidth: 2.5,
                borderDash: chartMode === 'compare' ? [5, 5] : [],
                pointBackgroundColor: '#2980b9',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 4.5,
                pointHoverRadius: 6,
                pointStyle: 'circle',
                tension: 0.25,
                fill: true
            });
            datasets.push({
                label: chartMode === 'compare' ? 'CSJDM Female Survivorship (%)' : 'female survivorship (%)',
                data: femaleRowsB.map(r => r.lx * 100),
                borderColor: '#d81b60',
                backgroundColor: 'rgba(216, 27, 96, 0.03)',
                borderWidth: 2.5,
                borderDash: chartMode === 'compare' ? [5, 5] : [],
                pointBackgroundColor: '#d81b60',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 5.5,
                pointHoverRadius: 7,
                pointStyle: 'rectRot',
                tension: 0.25,
                fill: true
            });
        }
        
        survivorshipChart.data.datasets = datasets;
        survivorshipChart.update();
        
        // Re-generate custom interactive HTML legend
        renderCustomLegend();
        
        // Update median diagnostics on the side of the chart
        updateDiagnostics();
    }

    function renderCustomLegend() {
        const legendContainer = document.getElementById('customChartLegend');
        if (!legendContainer || !survivorshipChart) return;
        
        legendContainer.innerHTML = '';
        const datasets = survivorshipChart.data.datasets;
        
        datasets.forEach((dataset, index) => {
            const legendPill = document.createElement('div');
            
            // Map the dataset labels or indexes to the correct classes
            let colorClass = 'legend-male';
            if (chartMode === 'cemeteryA') {
                colorClass = index === 0 ? 'legend-male' : 'legend-female';
            } else if (chartMode === 'cemeteryB') {
                colorClass = index === 0 ? 'legend-male-b' : 'legend-female-b';
            } else if (chartMode === 'compare') {
                if (index === 0) colorClass = 'legend-male';
                else if (index === 1) colorClass = 'legend-female';
                else if (index === 2) colorClass = 'legend-male-b';
                else if (index === 3) colorClass = 'legend-female-b';
            }
            
            legendPill.className = `legend-pill ${colorClass}`;
            legendPill.style.cursor = 'pointer';
            
            // Toggle opacity & visual state if hidden
            const isVisible = survivorshipChart.isDatasetVisible(index);
            if (!isVisible) {
                legendPill.style.opacity = '0.35';
                legendPill.style.textDecoration = 'line-through';
            } else {
                legendPill.style.opacity = '1';
                legendPill.style.textDecoration = 'none';
            }
            
            const line = document.createElement('span');
            line.className = 'legend-line';
            // Render dashes on B line markers in legend
            if (colorClass.includes('-b')) {
                line.style.borderTop = '3px dashed var(--accent-male-b)';
                if (colorClass === 'legend-female-b') {
                    line.style.borderTop = '3px dashed var(--accent-female-b)';
                }
                line.style.background = 'none';
                line.style.boxShadow = 'none';
                line.style.height = '0px';
                line.style.marginTop = '1px';
            }
            
            const text = document.createElement('span');
            text.textContent = dataset.label.replace(' lx', ''); // strip lx for clean display
            
            legendPill.appendChild(line);
            legendPill.appendChild(text);
            
            legendPill.addEventListener('click', () => {
                const currentVisible = survivorshipChart.isDatasetVisible(index);
                survivorshipChart.setDatasetVisibility(index, !currentVisible);
                survivorshipChart.update();
                renderCustomLegend(); // Refresh pill visual styles
            });
            
            legendContainer.appendChild(legendPill);
        });
    }

    function updateDiagnostics() {
        const maleRowsA = calculateLifeTable(cemeteries.cemeteryA.maleDeaths);
        const femaleRowsA = calculateLifeTable(cemeteries.cemeteryA.femaleDeaths);
        const maleRowsB = calculateLifeTable(cemeteries.cemeteryB.maleDeaths);
        const femaleRowsB = calculateLifeTable(cemeteries.cemeteryB.femaleDeaths);
        
        const medMA = calculateMedianLifespan(maleRowsA);
        const medFA = calculateMedianLifespan(femaleRowsA);
        const medMB = calculateMedianLifespan(maleRowsB);
        const medFB = calculateMedianLifespan(femaleRowsB);
        
        const maleMedianVal = document.getElementById('maleMedianVal');
        const femaleMedianVal = document.getElementById('femaleMedianVal');
        
        if (chartMode === 'cemeteryA') {
            if (maleMedianVal) maleMedianVal.textContent = `${medMA} years`;
            if (femaleMedianVal) femaleMedianVal.textContent = `${medFA} years`;
        } else if (chartMode === 'cemeteryB') {
            if (maleMedianVal) maleMedianVal.textContent = `${medMB} years`;
            if (femaleMedianVal) femaleMedianVal.textContent = `${medFB} years`;
        } else if (chartMode === 'compare') {
            if (maleMedianVal) maleMedianVal.textContent = `A: ${medMA} | B: ${medMB} yrs`;
            if (femaleMedianVal) femaleMedianVal.textContent = `A: ${medFA} | B: ${medFB} yrs`;
        }
    }
    
    // Updates colors of chart dynamically when theme switches
    function updateChartStyling() {
        if (!survivorshipChart) return;
        
        const isDark = document.body.classList.contains('theme-dark');
        const gridColor = isDark ? 'rgba(140, 125, 115, 0.18)' : 'rgba(92, 82, 76, 0.2)';
        const textColor = isDark ? '#baaea6' : '#5c524c';
        
        // Update Options
        survivorshipChart.options.plugins.tooltip.backgroundColor = isDark ? '#111827' : '#ffffff';
        survivorshipChart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#111827';
        survivorshipChart.options.plugins.tooltip.bodyColor = isDark ? '#d1d5db' : '#374151';
        survivorshipChart.options.plugins.tooltip.borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.3)';
        
        survivorshipChart.options.scales.x.grid.color = gridColor;
        survivorshipChart.options.scales.x.ticks.color = textColor;
        survivorshipChart.options.scales.x.title.color = textColor;
        
        survivorshipChart.options.scales.y.grid.color = gridColor;
        survivorshipChart.options.scales.y.ticks.color = textColor;
        survivorshipChart.options.scales.y.title.color = textColor;
        
        survivorshipChart.update();
    }

    /* ==========================================================================
       7. SHEETJS EXCEL PARSER AND COHORT STANDARDIZER
       ========================================================================== */

    function parseLifeTableSheetForGender(sheet, gender) {
        const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});
        if (rows.length === 0) return null;
        
        let dxColIndex = -1;
        let startRowIndex = -1;
        
        const isMale = (gender === 'male');
        
        function matchesGender(val) {
            const clean = val.toLowerCase().trim();
            if (isMale) {
                return clean.includes('male') || clean === 'm' || clean.startsWith('m ') || clean.endsWith(' m') || clean.includes(' m ') || clean.startsWith('m_') || clean.startsWith('m.');
            } else {
                return clean.includes('female') || clean === 'f' || clean.startsWith('f ') || clean.endsWith(' f') || clean.includes(' f ') || clean.startsWith('f_') || clean.startsWith('f.');
            }
        }
        
        function isDxHeader(val) {
            const clean = val.toLowerCase().trim();
            return (
                clean === 'dx' || 
                clean === 'd_x' || 
                clean === 'd(x)' || 
                clean === 'd' ||
                clean.includes('death') || 
                clean.includes('dying') || 
                clean.includes('dx (deaths)') ||
                clean.includes('deaths (dx)') ||
                clean === 'no. of deaths' ||
                clean === 'number of deaths'
            );
        }

        // 1. Search for gender-specific dx column
        for (let r = 0; r < Math.min(rows.length, 15); r++) {
            const row = rows[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                if (row[c] === undefined || row[c] === null) continue;
                const val = String(row[c]);
                if (matchesGender(val) && isDxHeader(val)) {
                    dxColIndex = c;
                    break;
                }
            }
            if (dxColIndex !== -1) break;
        }

        // 2. Fallback to generic dx column if gender-specific not found
        if (dxColIndex === -1) {
            for (let r = 0; r < Math.min(rows.length, 15); r++) {
                const row = rows[r];
                if (!row) continue;
                for (let c = 0; c < row.length; c++) {
                    if (row[c] === undefined || row[c] === null) continue;
                    const val = String(row[c]);
                    if (isDxHeader(val)) {
                        dxColIndex = c;
                        break;
                    }
                }
                if (dxColIndex !== -1) break;
            }
        }
        
        // 3. Search first 20 rows for the '0-4' age interval start row
        for (let r = 0; r < Math.min(rows.length, 20); r++) {
            const row = rows[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                if (row[c] === undefined || row[c] === null) continue;
                const val = String(row[c]).toLowerCase().replace(/\s+/g, '');
                if (val === '0' || val === '0-4' || val === '0-4years' || val === '0to4' || val.includes('0-4') || val === '0years') {
                    startRowIndex = r;
                    break;
                }
            }
            if (startRowIndex === r) break;
        }
        
        // Fallback start row
        if (dxColIndex !== -1 && startRowIndex === -1) {
            startRowIndex = 1;
        }

        // 4. Extract the deaths counts
        if (dxColIndex !== -1 && startRowIndex !== -1) {
            const deaths = [];
            for (let dataRow = startRowIndex; dataRow < rows.length; dataRow++) {
                if (deaths.length >= 22) break;
                if (!rows[dataRow] || rows[dataRow][dxColIndex] === undefined || rows[dataRow][dxColIndex] === null) {
                    deaths.push(0);
                    continue;
                }
                const val = parseFloat(rows[dataRow][dxColIndex]);
                deaths.push(isNaN(val) ? 0 : val);
            }
            while (deaths.length < 22) {
                deaths.push(0);
            }
            
            if (deaths.some(d => d > 0)) {
                return deaths;
            }
        }
        return null;
    }

    function parseRawDataSheet(sheet) {
        const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});
        if (rows.length === 0) return null;
        
        let genderCol = -1;
        let birthCol = -1;
        let deathCol = -1;
        let ageCol = -1;
        
        let headerRowIndex = -1;
        // Look for column headers in the first 30 rows
        for (let r = 0; r < Math.min(rows.length, 30); r++) {
            const row = rows[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                if (row[c] === undefined || row[c] === null) continue;
                const val = String(row[c]).toLowerCase().trim();
                if (val.includes('gender') || val.includes('sex') || val === 'm/f') {
                    genderCol = c;
                } else if (val.includes('born') || val.includes('birth') || val.includes('year born') || val.includes('birth year')) {
                    birthCol = c;
                } else if (val.includes('died') || val.includes('death') || val.includes('year died') || val.includes('death year')) {
                    deathCol = c;
                } else if (val.includes('age')) {
                    ageCol = c;
                }
            }
            if (genderCol !== -1 && (ageCol !== -1 || (birthCol !== -1 && deathCol !== -1))) {
                headerRowIndex = r;
                break;
            }
        }
        
        // Fallback defaults based on user's screenshot layout if headers are not matched
        if (headerRowIndex === -1) {
            genderCol = 2; // Column C
            birthCol = 3;  // Column D
            deathCol = 4;  // Column E
            ageCol = 5;    // Column F
            headerRowIndex = 0; // Scan from row 0
        }
        
        const maleDeaths = Array(22).fill(0);
        const femaleDeaths = Array(22).fill(0);
        
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row) continue;
            
            if (row[genderCol] === undefined || row[genderCol] === null) continue;
            const genderVal = String(row[genderCol]).toUpperCase().trim();
            if (!genderVal) continue;
            
            let age = -1;
            
            if (ageCol !== -1 && row[ageCol] !== undefined && row[ageCol] !== '') {
                const parsedAge = parseFloat(row[ageCol]);
                if (!isNaN(parsedAge)) age = parsedAge;
            }
            
            // If direct age is missing/invalid, try calculating from birth and death years
            if (age === -1 && birthCol !== -1 && deathCol !== -1 && row[birthCol] !== undefined && row[deathCol] !== undefined) {
                const birth = parseInt(row[birthCol]);
                const death = parseInt(row[deathCol]);
                if (!isNaN(birth) && !isNaN(death)) {
                    age = death - birth;
                }
            }
            
            if (age >= 0) {
                let binIndex = 0;
                if (age === 0) {
                    binIndex = 0;
                } else if (age >= 101) {
                    binIndex = 21;
                } else {
                    binIndex = Math.floor((age - 1) / 5) + 1;
                }
                if (genderVal.startsWith('M') || genderVal === 'MALE') {
                    maleDeaths[binIndex]++;
                } else if (genderVal.startsWith('F') || genderVal.startsWith('W') || genderVal === 'FEMALE' || genderVal === 'WOMAN') {
                    femaleDeaths[binIndex]++;
                }
            }
        }
        
        const hasMale = maleDeaths.some(c => c > 0);
        const hasFemale = femaleDeaths.some(c => c > 0);
        if (hasMale || hasFemale) {
            return {
                male: maleDeaths,
                female: femaleDeaths
            };
        }
        return null;
    }

    function standardizeCohort(deathsArray) {
        const sum = deathsArray.reduce((a, b) => a + b, 0);
        if (sum === 0) {
            const fallback = Array(22).fill(0);
            fallback[14] = cohortSize; // default cohort spike to keep it valid
            return fallback;
        }
        
        // Largest Remainder Method (Hamilton Method) to distribute exactly 200 deaths
        const target = cohortSize;
        const scaled = deathsArray.map(d => (d / sum) * target);
        const floored = scaled.map(s => Math.floor(s));
        const currentSum = floored.reduce((a, b) => a + b, 0);
        let diff = target - currentSum;
        
        if (diff > 0) {
            const fractionals = scaled.map((s, idx) => ({
                index: idx,
                frac: s - floored[idx]
            }));
            
            // Sort indices by fractional remainder descending
            fractionals.sort((a, b) => b.frac - a.frac);
            
            // Add remainder to the highest remainders
            for (let i = 0; i < diff; i++) {
                floored[fractionals[i].index]++;
            }
        }
        
        return floored;
    }

    function handleXLSXUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                let parsedMaleDeaths = null;
                let parsedFemaleDeaths = null;
                
                // 1. Scan for raw data sheets (e.g. name contains data/entry/raw or rows > 50)
                let rawSheet = null;
                for (const name of workbook.SheetNames) {
                    const lowerName = name.toLowerCase();
                    const sheet = workbook.Sheets[name];
                    const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});
                    
                    if (lowerName.includes('data') || lowerName.includes('entry') || lowerName.includes('raw') || rows.length > 50) {
                        rawSheet = sheet;
                        break;
                    }
                }
                
                if (rawSheet) {
                    const rawData = parseRawDataSheet(rawSheet);
                    if (rawData) {
                        if (rawData.male.some(c => c > 0)) parsedMaleDeaths = rawData.male;
                        if (rawData.female.some(c => c > 0)) parsedFemaleDeaths = rawData.female;
                    }
                }
                
                // 2. If no raw sheet or it failed to parse, look for binned sheets
                if (!parsedMaleDeaths || !parsedFemaleDeaths) {
                    for (const name of workbook.SheetNames) {
                        const lowerName = name.toLowerCase();
                        const sheet = workbook.Sheets[name];
                        
                        if (lowerName.includes('male') && !lowerName.includes('female')) {
                            const pMale = parseLifeTableSheetForGender(sheet, 'male');
                            if (pMale) parsedMaleDeaths = pMale;
                        } else if (lowerName.includes('female')) {
                            const pFemale = parseLifeTableSheetForGender(sheet, 'female');
                            if (pFemale) parsedFemaleDeaths = pFemale;
                        } else {
                            const pMale = parseLifeTableSheetForGender(sheet, 'male');
                            const pFemale = parseLifeTableSheetForGender(sheet, 'female');
                            if (pMale && !parsedMaleDeaths) parsedMaleDeaths = pMale;
                            if (pFemale && !parsedFemaleDeaths) parsedFemaleDeaths = pFemale;
                        }
                    }
                }
                
                // 3. Fallback: Parse the first sheet as raw data
                if ((!parsedMaleDeaths || !parsedFemaleDeaths) && workbook.SheetNames.length > 0) {
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawData = parseRawDataSheet(firstSheet);
                    if (rawData) {
                        if (!parsedMaleDeaths && rawData.male.some(c => c > 0)) parsedMaleDeaths = rawData.male;
                        if (!parsedFemaleDeaths && rawData.female.some(c => c > 0)) parsedFemaleDeaths = rawData.female;
                    }
                }
                
                // 4. Fallback: Parse the first sheet as binned data
                if ((!parsedMaleDeaths || !parsedFemaleDeaths) && workbook.SheetNames.length > 0) {
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const pMale = parseLifeTableSheetForGender(firstSheet, 'male');
                    const pFemale = parseLifeTableSheetForGender(firstSheet, 'female');
                    if (!parsedMaleDeaths && pMale) parsedMaleDeaths = pMale;
                    if (!parsedFemaleDeaths && pFemale) parsedFemaleDeaths = pFemale;
                }
                
                let importedAny = false;
                if (parsedMaleDeaths && parsedMaleDeaths.some(d => d > 0)) {
                    cemeteries[activeCemetery].maleDeaths = standardizeCohort(parsedMaleDeaths);
                    importedAny = true;
                }
                if (parsedFemaleDeaths && parsedFemaleDeaths.some(d => d > 0)) {
                    cemeteries[activeCemetery].femaleDeaths = standardizeCohort(parsedFemaleDeaths);
                    importedAny = true;
                }
                
                if (importedAny) {
                    recalculateAndRefresh();
                    
                    const hasMale = parsedMaleDeaths && parsedMaleDeaths.some(d => d > 0);
                    const hasFemale = parsedFemaleDeaths && parsedFemaleDeaths.some(d => d > 0);
                    
                    if (hasMale && hasFemale) {
                        alert("Data has been loaded: 200 males and 200 females (total cohort of 400).");
                    } else if (hasMale) {
                        alert("Data has been loaded: 200 males (total cohort of 200).");
                    } else if (hasFemale) {
                        alert("Data has been loaded: 200 females (total cohort of 200).");
                    } else {
                        alert("Data has been loaded: cohort size standardized to 200.");
                    }
                } else {
                    alert("Could not detect valid demographic data in the uploaded Excel file.\nPlease verify it contains either:\n1. A 'Data Entry' tab with Gender and Age (or Born & Died years) columns.\n2. Binned columns for Male/Female deaths (dx) in a sheet.");
                }
            } catch (err) {
                console.error("Excel parser error:", err);
                alert("Error reading Excel file. Make sure it is a valid, uncorrupted .xlsx or .xls file.");
            }
        };
        reader.readAsArrayBuffer(file);
        
        e.target.value = '';
    }

    function setupXLSXUploads() {
        document.querySelectorAll('.xlsx-upload-input').forEach(input => {
            input.addEventListener('change', handleXLSXUpload);
        });
    }

    /* ==========================================================================
       8. FIELD DETAILS SYNCHRONIZER & PHOTO PREVIEW PRESET
       ========================================================================== */

    function populateDetailsUI() {
        if (document.getElementById('cemAName')) document.getElementById('cemAName').innerText = cemeteries.cemeteryA.name;
        if (document.getElementById('cemALocation')) document.getElementById('cemALocation').innerText = cemeteries.cemeteryA.location;
        if (document.getElementById('cemADate')) document.getElementById('cemADate').innerText = cemeteries.cemeteryA.date;
        if (document.getElementById('cemADesc')) document.getElementById('cemADesc').innerText = cemeteries.cemeteryA.desc;
        if (document.getElementById('cemAPhoto')) document.getElementById('cemAPhoto').src = cemeteries.cemeteryA.photo;

        if (document.getElementById('cemBName')) document.getElementById('cemBName').innerText = cemeteries.cemeteryB.name;
        if (document.getElementById('cemBLocation')) document.getElementById('cemBLocation').innerText = cemeteries.cemeteryB.location;
        if (document.getElementById('cemBDate')) document.getElementById('cemBDate').innerText = cemeteries.cemeteryB.date;
        if (document.getElementById('cemBDesc')) document.getElementById('cemBDesc').innerText = cemeteries.cemeteryB.desc;
        if (document.getElementById('cemBPhoto')) document.getElementById('cemBPhoto').src = cemeteries.cemeteryB.photo;
        
        updateSelectorButtonLabels();
    }
    
    function updateSelectorButtonLabels() {
        document.querySelectorAll(`button[data-cemetery="cemeteryA"]`).forEach(btn => {
            btn.textContent = cemeteries.cemeteryA.name;
        });
        document.querySelectorAll(`button[data-cemetery="cemeteryB"]`).forEach(btn => {
            btn.textContent = cemeteries.cemeteryB.name;
        });
        document.querySelectorAll(`button[data-mode="cemeteryA"]`).forEach(btn => {
            btn.textContent = cemeteries.cemeteryA.name;
        });
        document.querySelectorAll(`button[data-mode="cemeteryB"]`).forEach(btn => {
            btn.textContent = cemeteries.cemeteryB.name;
        });
    }

    function syncCemeteryDetails() {
        const fields = ['name', 'location', 'date', 'desc'];
        const keys = ['A', 'B'];
        
        keys.forEach(k => {
            const cemeteryKey = k === 'A' ? 'cemeteryA' : 'cemeteryB';
            fields.forEach(field => {
                const elementId = `cem${k}${field.charAt(0).toUpperCase() + field.slice(1)}`;
                const el = document.getElementById(elementId);
                if (el) {
                    el.addEventListener('input', () => {
                        const val = el.innerText || el.textContent;
                        cemeteries[cemeteryKey][field] = val.trim();
                        if (field === 'name') {
                            updateSelectorButtonLabels();
                        }
                        saveCemeteriesToLocalStorage();
                    });
                }
            });
        });
    }

    function setupPhotoUploads() {
        document.querySelectorAll('.photo-upload-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const cemeteryKey = input.dataset.cemetery;
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const dataUrl = evt.target.result;
                    cemeteries[cemeteryKey].photo = dataUrl;
                    
                    const imgId = cemeteryKey === 'cemeteryA' ? 'cemAPhoto' : 'cemBPhoto';
                    const img = document.getElementById(imgId);
                    if (img) {
                        img.src = dataUrl;
                    }
                    saveCemeteriesToLocalStorage();
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function setupGalleryUploads() {
        // Restore gallery photos from localStorage on startup
        const galleryIds = ['galleryPhoto1', 'galleryPhoto2'];
        galleryIds.forEach(id => {
            const img = document.getElementById(id);
            if (img) {
                const savedPhoto = localStorage.getItem(`gallery_image_${id}`);
                if (savedPhoto) {
                    img.src = savedPhoto;
                }
            }
        });

        // Listen to change events on the gallery file inputs
        document.querySelectorAll('.gallery-upload-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const galleryId = input.dataset.galleryId;
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(evt) {
                    const dataUrl = evt.target.result;
                    const img = document.getElementById(galleryId);
                    if (img) {
                        img.src = dataUrl;
                    }
                    localStorage.setItem(`gallery_image_${galleryId}`, dataUrl);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    /* ==========================================================================
       9. IMAGE EXPANDER & LIGHTBOX HANDLER
       ========================================================================== */
    
    function setupLightbox() {
        // Find images and delegate
        document.addEventListener('click', (e) => {
            if (!isSlideMode()) return; // Disable in scrollable paper view
            
            const target = e.target;
            if (target.classList.contains('field-photo') || target.classList.contains('gallery-img')) {
                lightbox.style.display = 'block';
                lightboxImg.src = target.src;
                lightboxCaption.textContent = target.alt || "Field photograph detail.";
            }
        });
        
        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lightboxClose) {
                closeLightbox();
            }
        });
        
        // Escape key to close lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.style.display === 'block') {
                closeLightbox();
            }
        });
    }
    
    function closeLightbox() {
        lightbox.style.display = 'none';
    }

    /* ==========================================================================
       10. TRIGGERS & SYNC BUTTONS
       ========================================================================== */

    function setupCemeteryButtons() {
        document.querySelectorAll('.cem-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedCemetery = btn.dataset.cemetery;
                activeCemetery = selectedCemetery;
                
                // Sync active class on all selector buttons
                document.querySelectorAll('.cem-select-btn').forEach(b => {
                    if (b.dataset.cemetery === selectedCemetery) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
                
                // Refresh views
                recalculateAndRefresh();
            });
        });
        
        document.querySelectorAll('.chart-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                chartMode = btn.dataset.mode;
                
                document.querySelectorAll('.chart-mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                updateChartData();
            });
        });
    }

    /* ==========================================================================
       10.5 LOCAL STORAGE & HTML DOWNLOAD PERSISTENCE CODES
       ========================================================================== */
    
    function saveCemeteriesToLocalStorage() {
        localStorage.setItem('survivorship_cemeteries', JSON.stringify(cemeteries));
    }

    function initContentEditablePersistence() {
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        
        // Load from localStorage
        editableElements.forEach(el => {
            const id = el.id;
            if (id) {
                const savedValue = localStorage.getItem(`editable_${id}`);
                if (savedValue !== null) {
                    el.innerHTML = savedValue;
                }
            }
        });
        
        // Save on input event
        document.addEventListener('input', (e) => {
            const el = e.target;
            if (el.getAttribute('contenteditable') === 'true' && el.id) {
                localStorage.setItem(`editable_${el.id}`, el.innerHTML);
            }
        });
    }

    function saveAndDownloadHTML() {
        // Clone the document element
        const clone = document.documentElement.cloneNode(true);
        
        // 1. Bake in current dx-input values
        const clonedInputs = clone.querySelectorAll('.dx-input');
        clonedInputs.forEach(input => {
            const gender = input.dataset.gender;
            const index = parseInt(input.dataset.index);
            const originalInput = document.querySelector(`.dx-input[data-gender="${gender}"][data-index="${index}"]`);
            if (originalInput) {
                input.setAttribute('value', originalInput.value);
            }
        });

        // 2. Save complete state object to application/json script
        let stateScript = clone.querySelector('#saved-state-data');
        if (!stateScript) {
            stateScript = document.createElement('script');
            stateScript.id = 'saved-state-data';
            stateScript.type = 'application/json';
            clone.querySelector('body').appendChild(stateScript);
        }
        stateScript.textContent = JSON.stringify(cemeteries);

        // 3. Reset slide mode view state in clone
        const activeSections = clone.querySelectorAll('.slide-section.active');
        activeSections.forEach(el => el.classList.remove('active'));
        const slide0 = clone.querySelector('#slide0');
        if (slide0) slide0.classList.add('active');

        const activeNavItems = clone.querySelectorAll('.sidebar-nav .nav-item.active');
        activeNavItems.forEach(el => el.classList.remove('active'));
        const navItem0 = clone.querySelector('.sidebar-nav .nav-item[data-slide="0"]');
        if (navItem0) navItem0.classList.add('active');

        const activeDots = clone.querySelectorAll('#indicatorDots .dot.active');
        activeDots.forEach(el => el.classList.remove('active'));
        const dots = clone.querySelectorAll('#indicatorDots .dot');
        if (dots && dots.length > 0) {
            dots[0].classList.add('active');
        }

        const progressBar = clone.querySelector('#progressBar');
        if (progressBar) progressBar.style.width = '0%';

        const currentSlideNum = clone.querySelector('#currentSlideNum');
        if (currentSlideNum) currentSlideNum.textContent = '1';

        const lightbox = clone.querySelector('#lightbox');
        if (lightbox) lightbox.style.display = 'none';

        // 4. Construct file content and download
        const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    /* ==========================================================================
       11. SYSTEM INITIALIZATION CALLS
       ========================================================================== */
    
    // 0. Load saved state from script tag or localStorage
    const savedStateEl = document.getElementById('saved-state-data');
    if (savedStateEl) {
        try {
            const parsed = JSON.parse(savedStateEl.textContent);
            if (parsed.cemeteryA) Object.assign(cemeteries.cemeteryA, parsed.cemeteryA);
            if (parsed.cemeteryB) Object.assign(cemeteries.cemeteryB, parsed.cemeteryB);
        } catch(e) {
            console.error("Failed to parse saved state from script tag:", e);
        }
    }

    const storedCem = localStorage.getItem('survivorship_cemeteries');
    if (storedCem) {
        try {
            const parsed = JSON.parse(storedCem);
            const isValidA = parsed.cemeteryA && Array.isArray(parsed.cemeteryA.maleDeaths) && parsed.cemeteryA.maleDeaths.length === 22;
            const isValidB = parsed.cemeteryB && Array.isArray(parsed.cemeteryB.maleDeaths) && parsed.cemeteryB.maleDeaths.length === 22;
            if (isValidA && isValidB) {
                if (parsed.cemeteryA) Object.assign(cemeteries.cemeteryA, parsed.cemeteryA);
                if (parsed.cemeteryB) Object.assign(cemeteries.cemeteryB, parsed.cemeteryB);
            } else {
                console.warn("Stored data is in old 21-bin format, clearing localStorage and using new 22-bin defaults.");
                localStorage.removeItem('survivorship_cemeteries');
            }
        } catch(e) {
            console.error("Error loading cemeteries from localStorage:", e);
        }
    }

    // Initialize contenteditable persistence
    initContentEditablePersistence();

    // Setup floppy disk button listener
    const saveHtmlBtn = document.getElementById('saveHtmlBtn');
    if (saveHtmlBtn) {
        saveHtmlBtn.addEventListener('click', saveAndDownloadHTML);
    }

    // 1. Build slide dots
    initDots();
    
    // 2. Populate site details initially
    populateDetailsUI();
    
    // 3. Perform initial calculations & render tables
    recalculateAndRefresh();
    
    // 4. Setup Chart.js
    initChart();
    
    // 5. Setup Lightbox triggers
    setupLightbox();
    
    // 6. Setup custom XLSX and photo inputs
    setupXLSXUploads();
    setupPhotoUploads();
    setupGalleryUploads();
    
    // 7. Setup contenteditable syncs
    syncCemeteryDetails();
    
    // 8. Setup cemetery toggle buttons
    setupCemeteryButtons();
    
    // 9. Explicitly go to first slide
    goToSlide(0);
});
