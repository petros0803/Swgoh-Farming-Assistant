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

  const container = document.getElementById('roadmapContainer');
  container.innerHTML = '';

  let totalRequirements = 0;
  let totalMetRequirements = 0;

  farmingRoadmap.forEach((phase) => {
    const phaseBlock = document.createElement('div');
    phaseBlock.className = 'phase-block';

    let phaseTotalCount = phase.characters.length + phase.ships.length;
    let phaseMetCount = 0;

    const sectionsContainer = document.createElement('div');
    sectionsContainer.className = 'phase-sections';

    const createSection = (title, unitsList, isShipSection = false) => {
      if (!unitsList || unitsList.length === 0) return null;

      const sectionWrapper = document.createElement('div');
      sectionWrapper.className = 'unit-type-section';
      
      const sectionHeader = document.createElement('h3');
      sectionHeader.className = 'section-subtitle';
      sectionHeader.textContent = title;
      sectionWrapper.appendChild(sectionHeader);

      const grid = document.createElement('div');
      grid.className = 'units-grid';

      unitsList.forEach(target => {
        totalRequirements++;
        const unit = rosterMap[target.id];

        const currentStars = unit ? unit.rarity : 0;
        const currentRelic = (unit && unit.relic_tier > 2) ? unit.relic_tier - 2 : 0;
        const currentGear = unit ? unit.gear_level : 0;

        let iconUrl = target.icon;
        if (!iconUrl && unit && unit.image) {
          iconUrl = unit.image;
        }

        const svgFallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4M12 16h.01'/></svg>";

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

        const card = document.createElement('div');
        card.className = `unit-card ${cardStatusClass}`;
        card.innerHTML = `
          <div class="unit-card-header">
            <img src="${iconUrl || svgFallback}" 
                 alt="${target.name}" 
                 class="unit-portrait" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${svgFallback}';" />
            <div class="unit-info">
              <div class="unit-name">${target.name}</div>
              <div class="unit-meta">
                <span>${currentProgressDesc}</span>
              </div>
            </div>
          </div>
          <div class="status-tag">${statusText}</div>
        `;
        grid.appendChild(card);
      });

      sectionWrapper.appendChild(grid);
      return sectionWrapper;
    };

    const charSection = createSection("👤 CHARACTERS", phase.characters, false);
    const shipSection = createSection("🛸 SHIPS", phase.ships, true);

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