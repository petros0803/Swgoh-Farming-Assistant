// On DOM content loaded, handle URL query parameters for ally code
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const allyCodeParam = urlParams.get('allycode');

  if (allyCodeParam) {
    const allyInput = document.getElementById('allyCode');
    if (allyInput) {
      allyInput.value = allyCodeParam;
      fetchRoster(); // Automatically sync roster if param exists
    }
  }
});

// Helper to pre-calculate which units appear in multiple phases
function buildSharedUnitMap(roadmap) {
  const unitOccurrences = {};

  roadmap.forEach((phase, phaseIdx) => {
    // Clean up phase name for display (e.g., "Phase 1: Executor" -> "Executor")
    const shortName = phase.category.split(':')[1]?.trim() || phase.category;

    const processList = (list) => {
      if (!list) return;
      list.forEach(target => {
        const id = target.id ? target.id.toUpperCase() : "";
        if (!id) return;

        if (!unitOccurrences[id]) {
          unitOccurrences[id] = [];
        }
        // Avoid duplicate phase entries for the same unit
        if (!unitOccurrences[id].some(p => p.index === phaseIdx)) {
          unitOccurrences[id].push({ index: phaseIdx, name: shortName });
        }
      });
    };

    processList(phase.characters);
    processList(phase.ships);
  });

  return unitOccurrences;
}

async function fetchRoster() {
  const allyInput = document.getElementById('allyCode');
  const allyCode = allyInput.value.replace(/-/g, '').trim();
  const errorBanner = document.getElementById('errorBanner');
  const spinner = document.getElementById('spinner');
  const btnText = document.querySelector('.btn-text');

  errorBanner.style.display = 'none';

  if (!allyCode || allyCode.length !== 9 || isNaN(allyCode)) {
    showError("Please enter a valid 9-digit SWGoH Ally Code.");
    return;
  }

  // Update URL query parameter seamlessly without triggering a page reload
  const newUrl = `${window.location.pathname}?allycode=${allyCode}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  spinner.style.display = 'inline-block';
  btnText.textContent = "SYNCING...";

  try {
    const response = await fetch(`https://swgoh.gg/api/player/${allyCode}/`);
    
    if (!response.ok) {
      throw new Error("Unable to locate profile. Verify your Ally Code on SWGoH.gg.");
    }

    const data = await response.json();
    renderDashboard(data);

  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = 'none';
    btnText.textContent = "SYNC ROSTER";
  }
}

function showError(message) {
  const errorBanner = document.getElementById('errorBanner');
  errorBanner.textContent = message;
  errorBanner.style.display = 'block';
}

function renderDashboard(playerData) {
  document.getElementById('statsOverview').style.display = 'grid';
  document.getElementById('playerName').textContent = playerData.data.name || 'Unknown';
  document.getElementById('playerGP').textContent = (playerData.data.galactic_power || 0).toLocaleString();

  const rosterMap = {};
  if (playerData.units) {
    playerData.units.forEach(u => {
      rosterMap[u.data.base_id] = u.data;
    });
  }

  // Pre-calculate shared occurrences across the entire roadmap
  const sharedMap = buildSharedUnitMap(farmingRoadmap);

  const container = document.getElementById('roadmapContainer');
  container.innerHTML = '';

  let totalRequirements = 0;
  let totalMetRequirements = 0;

  farmingRoadmap.forEach((phase, phaseIndex) => {
    const phaseBlock = document.createElement('div');
    phaseBlock.className = 'phase-block';

    let phaseTotalCount = phase.characters.length + phase.ships.length;
    let phaseMetCount = 0;

    const sectionsContainer = document.createElement('div');
    sectionsContainer.className = 'phase-sections';

const createSection = (title, unitsList, isShipSection = false, currentPhaseIndex = 0) => {
      if (!unitsList || unitsList.length === 0) return null;

      const sectionWrapper = document.createElement('div');
      sectionWrapper.className = 'unit-type-section';
      
      const sectionHeader = document.createElement('h3');
      sectionHeader.className = 'section-subtitle';
      sectionHeader.style.display = 'flex';
      sectionHeader.style.alignItems = 'center';
      sectionHeader.style.justifyContent = 'space-between';
      
      let headerHtml = `<span>${title}</span>`;

      if (phase.category.includes("C-3PO Event")) {
        headerHtml += `
          <div class="tooltip-container" style="position: relative; display: inline-block; cursor: help;">
            <span style="background: #30363d; border: 1px solid #8b949e; color: #c9d1d9; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">?</span>
            <div class="tooltip-text" style="visibility: hidden; width: 260px; background-color: #161b22; color: #c9d1d9; text-align: left; border-radius: 6px; padding: 10px; position: absolute; z-index: 1; bottom: 125%; right: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.5); border: 1px solid #30363d; font-size: 12px; font-weight: normal; line-height: 1.4;">
              <strong>Farming Strategy:</strong> Princess Kneesaa, Chief Chirpa, and Wicket are already tracked under your Leia path.<br><br>
              <strong>Recommendation:</strong> Complete your 5-man event squad by adding <strong>Logray</strong>, <strong>Ewok Elder</strong>, and <strong>Paploo</strong>.
            </div>
          </div>
        `;
      }

      sectionHeader.innerHTML = headerHtml;

      if (phase.category.includes("C-3PO Event")) {
        const container = sectionHeader.querySelector('.tooltip-container');
        const tip = sectionHeader.querySelector('.tooltip-text');
        container.addEventListener('mouseenter', () => tip.style.visibility = 'visible');
        container.addEventListener('mouseleave', () => tip.style.visibility = 'hidden');
      }

      sectionWrapper.appendChild(sectionHeader);

      const grid = document.createElement('div');
      grid.className = 'units-grid';

      unitsList.forEach(target => {
        totalRequirements++;
        const unit = rosterMap[target.id ? target.id.toUpperCase() : ""];

        const currentStars = unit ? unit.rarity : 0;
        const currentRelic = (unit && unit.relic_tier > 2) ? unit.relic_tier - 2 : 0;
        const currentGear = unit ? unit.gear_level : 0;

        let iconUrl = target.icon;
        if (!iconUrl && unit && unit.image) {
          iconUrl = unit.image;
        }

        const svgFallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4M12 16h.01'/></svg>";

        // Determine portrait border color based on alignment
        let portraitBorderColor = "#8b949e"; // default gray fallback
        if (target.alignment === "dark") {
          portraitBorderColor = "#f85149"; // Red for Dark Side
        } else if (target.alignment === "light") {
          portraitBorderColor = "#58a6ff"; // Blue for Light Side
        } else if (target.alignment === "neutral") {
          portraitBorderColor = "#ffffff"; // White for Unaligned Force User
        }

        let isComplete = false;
        let statusText = '';
        let currentProgressDesc = '';

        if (target.targetR) {
          isComplete = currentRelic >= target.targetR;
          statusText = isComplete ? 'Complete' : `Need R${target.targetR}`;
          currentProgressDesc = `G${currentGear} | R${currentRelic}/${target.targetR} (★${currentStars}/7)`;
        } else {
          isComplete = currentStars >= target.targetStars;
          statusText = isComplete ? 'Complete' : `Need ${target.targetStars}★`;
          currentProgressDesc = `Stars: ${currentStars}★ / ${target.targetStars}★`;
        }

        if (isComplete) {
          totalMetRequirements++;
          phaseMetCount++;
        }

        const cardStatusClass = isComplete ? 'completed' : (unit ? 'in-progress' : 'not-started');
        const targetId = target.id ? target.id.toUpperCase() : "";

        // Unified badge logic
        let roleBadgeHtml = '';
        if (phase.category.includes("C-3PO Event")) {
          if (["PRINCESSKNEESAA", "CHIEFCHIRPA", "WICKET"].includes(targetId)) {
            roleBadgeHtml = `<div style="font-size: 10px; background: rgba(35, 134, 54, 0.2); color: #3fb950; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block; border: 1px solid rgba(35, 134, 54, 0.4);">Shared with GL Leia</div>`;
          } else if (["LOGRAY", "EWOKELDER", "PAPLOO"].includes(targetId)) {
            roleBadgeHtml = `<div style="font-size: 10px; background: rgba(187, 128, 9, 0.2); color: #e3b341; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block; border: 1px solid rgba(187, 128, 9, 0.4);">★ Recommended Choice</div>`;
          }
        } else {
          // Check other roadmap phases for this unit
          const occurrences = sharedMap[targetId] || [];
          const otherPhases = occurrences.filter(p => p.index !== currentPhaseIndex);
          if (otherPhases.length > 0) {
            // Grab the name of the first other phase it appears in
            const sharedWithName = otherPhases[0].name;
            roleBadgeHtml = `<div style="font-size: 10px; background: rgba(56, 139, 253, 0.2); color: #58a6ff; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block; border: 1px solid rgba(56, 139, 253, 0.4);">Shared with ${sharedWithName}</div>`;
          }
        }

const card = document.createElement('div');
        card.className = `unit-card ${cardStatusClass}`;
        card.innerHTML = `
          <div class="unit-card-header">
            <img src="${iconUrl || svgFallback}" 
                 alt="${target.name}" 
                 class="unit-portrait" 
                 loading="lazy"
                 style="border: 2px solid ${portraitBorderColor}; border-radius: 4px; flex-shrink: 0;"
                 onerror="this.onerror=null; this.src='${svgFallback}';" />
            <div class="unit-info">
              <div class="unit-name" style="min-height: 2.4em; line-height: 1.2; margin-bottom: 4px;">${target.name}</div>
              <div class="unit-meta">
                <span>${currentProgressDesc}</span>
              </div>
              <div style="margin-top: auto;">
                ${roleBadgeHtml}
              </div>
            </div>
          </div>
          <div class="status-tag" style="margin-top: 12px;">${statusText}</div>
        `;
        grid.appendChild(card);
      });

      sectionWrapper.appendChild(grid);
      return sectionWrapper;
    };

    const charSection = createSection("👤 CHARACTERS", phase.characters, false, phaseIndex);
    const shipSection = createSection("🛸 SHIPS", phase.ships, true, phaseIndex);

    if (charSection) sectionsContainer.appendChild(charSection);
    if (shipSection) sectionsContainer.appendChild(shipSection);

    const phasePercent = phaseTotalCount > 0 ? Math.round((phaseMetCount / phaseTotalCount) * 100) : 0;

    // Header element with collapsible functionality
    const phaseHeader = document.createElement('div');
    phaseHeader.className = 'phase-header';
    phaseHeader.style.cursor = 'pointer';
    phaseHeader.innerHTML = `
      <div class="phase-title">
        <span class="collapse-icon" style="display:inline-block; transition: transform 0.2s; margin-right: 8px;">▼</span>
        ${phase.category}
      </div>
      <div class="phase-badge">${phaseMetCount} / ${phaseTotalCount} Ready (${phasePercent}%)</div>
    `;

    // Toggle collapse state on header click
    phaseHeader.addEventListener('click', () => {
      const isCollapsed = sectionsContainer.style.display === 'none';
      sectionsContainer.style.display = isCollapsed ? 'block' : 'none';
      const icon = phaseHeader.querySelector('.collapse-icon');
      if (icon) {
        icon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });

    phaseBlock.appendChild(phaseHeader);
    phaseBlock.appendChild(sectionsContainer);
    container.appendChild(phaseBlock);
  });

  const overallPct = totalRequirements > 0 ? Math.round((totalMetRequirements / totalRequirements) * 100) : 0;
  document.getElementById('overallProgress').textContent = `${overallPct}%`;
  document.getElementById('overallFill').style.width = `${overallPct}%`;
}