(function () {
  if (typeof checkMinimumVersion === 'function') {
    checkMinimumVersion('3.4.4', '预设条目可视化移动');
  }

  // ===== 清理旧元素 =====
  function cleanOldUI() {
    $('.prompt-manager-select-action').remove();
    $('.completion_prompt_manager_prompt.pm-selected').removeClass('pm-selected');
  }

  // ===== 弹窗选择条目 =====
  async function selectPrompts() {
    const preset = getPreset('in_use');
    if (!preset || !preset.prompts.length) {
      SillyTavern.callGenericPopup('当前没有预设条目', SillyTavern.POPUP_TYPE.ALERT);
      return;
    }

    let selectedIds = [];

    const html = $('<div style="max-height:400px;overflow:auto;"></div>');
    preset.prompts.forEach(p => {
      const $label = $(`<label style="display:block;margin:4px 0;">
        <input type="checkbox" data-id="${p.id}"> ${p.name || p.id}
      </label>`);
      html.append($label);
    });

    await SillyTavern.callGenericPopup(html[0], SillyTavern.POPUP_TYPE.CUSTOM, {
      title: '选择要移动的条目',
      buttons: ['确定', '取消'],
      callback: (btn) => {
        if (btn === '确定') {
          selectedIds = html.find('input:checked').map((_, el) => $(el).data('id')).get();
        }
      }
    });

    if (!selectedIds.length) return;

    moveStep(selectedIds);
  }

  // ===== 第二步：移动条目 =====
  async function moveStep(selectedIds) {
    const preset = getPreset('in_use');
    if (!preset) return;

    const html = $('<div style="max-height:400px;overflow:auto;"></div>');
    preset.prompts.forEach((p, idx) => {
      const $row = $(`<div style="display:flex;justify-content:space-between;margin:4px 0;">
        <span>${p.name || p.id}</span>
      </div>`);
      if (selectedIds.includes(p.id)) {
        const $btn = $('<button>移动至上方</button>').on('click', async () => {
          await updatePresetWith('in_use', preset => {
            const indices = [];
            selectedIds.forEach(id => {
              const i = preset.prompts.findIndex(p => p.id === id);
              if (i !== -1) indices.push(i);
            });
            indices.sort((a,b)=>a-b).forEach((i, n) => {
              const [item] = preset.prompts.splice(i+n,1);
              preset.prompts.splice(0,0,item);
            });
            return preset;
          }, { render: 'immediate' });
          SillyTavern.callGenericPopup('移动完成', SillyTavern.POPUP_TYPE.ALERT);
        });
        $row.append($btn);
      }
      html.append($row);
    });

    await SillyTavern.callGenericPopup(html[0], SillyTavern.POPUP_TYPE.CUSTOM, {title:'移动条目'});
  }

  // ===== 顶部按钮触发 =====
  function addMainButton() {
    cleanOldUI();

    // 尝试多个常用位置
    const $header = $('#completion_prompt_manager .prompt_manager_header, #completion_prompt_manager_header, .quick_reply_buttons');
    if (!$header.length) return;

    if ($header.find('.prompt-manager-visual-move').length) return;

    const $btn = $('<button class="prompt-manager-visual-move btn">可视化移动条目</button>').on('click', () => {
      selectPrompts();
    });

    // 放在第一个找到的 header 或快捷按钮区
    $header.first().append($btn);
  }

  // ===== 初始化 =====
  const observer = new MutationObserver(() => {
    addMainButton();
  });
  observer.observe(document.body, {childList:true, subtree:true});

})();
