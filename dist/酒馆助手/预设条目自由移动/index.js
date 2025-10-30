(function () {
  // ======= 版本检测与信息加载 =======
  if (typeof checkMinimumVersion === 'function') {
    checkMinimumVersion('3.4.4', '预设条目自由移动');
  }
  if (typeof loadReadme === 'function') {
    loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/预设条目更多按钮/README.md');
  }

  let selectedPromptId = null;

  // 移动条目到目标序号
  async function movePromptToIndex(prompt_id, targetIndex) {
    await updatePresetWith(
      'in_use',
      preset => {
        const idx = preset.prompts.findIndex(p => p.id === prompt_id);
        if (idx === -1) return preset;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= preset.prompts.length) targetIndex = preset.prompts.length - 1;
        if (targetIndex === idx) return preset;
        const [item] = preset.prompts.splice(idx, 1);
        preset.prompts.splice(targetIndex, 0, item);
        return preset;
      },
      { render: 'immediate' }
    );
    selectedPromptId = null;
    $('.completion_prompt_manager_prompt.pm-selected')
      .removeClass('pm-selected')
      .find('.prompt-manager-select-action')
      .removeClass('fa-square-check')
      .addClass('fa-square');
  }

  // 创建顶部移动按钮
  function ensureGlobalMoveButton() {
    const $header = $('#completion_prompt_manager .prompt_manager_header, #completion_prompt_manager_header');
    if (!$header.length || $header.find('.prompt-manager-move-selected').length) return;

    const $btn = $('<button class="prompt-manager-move-selected btn">移动已选条目</button>').on('click', async () => {
      if (!selectedPromptId) {
        SillyTavern.callGenericPopup('请先选中一个条目', SillyTavern.POPUP_TYPE.ALERT);
        return;
      }
      const preset = getPreset('in_use');
      const max = preset?.prompts?.length ?? 0;
      const input = await SillyTavern.callGenericPopup(`输入目标序号 (1-${max})：`, SillyTavern.POPUP_TYPE.PROMPT);
      if (!input) return;
      const num = parseInt(input);
      if (Number.isNaN(num) || num < 1 || num > max) {
        SillyTavern.callGenericPopup('输入无效', SillyTavern.POPUP_TYPE.ALERT);
        return;
      }
      await movePromptToIndex(selectedPromptId, num - 1);
    });

    $header.append($btn);
  }

  // 给每个条目增加选择按钮
  function addSelectButton($prompts) {
    $prompts.find('.prompt_manager_prompt_controls').each(function () {
      const $controls = $(this);
      if ($controls.find('.prompt-manager-select-action').length) return;

      const $span = $('<span title="select" class="prompt-manager-select-action fa-regular fa-square fa-xs"></span>').on('click', function () {
        const $thisPrompt = $(this).closest('.completion_prompt_manager_prompt');
        const id = $thisPrompt.attr('data-pm-identifier');
        if (selectedPromptId === id) {
          // 取消选中
          selectedPromptId = null;
          $thisPrompt.removeClass('pm-selected');
          $(this).removeClass('fa-square-check').addClass('fa-square');
        } else {
          // 取消之前选中
          $('.completion_prompt_manager_prompt.pm-selected')
            .removeClass('pm-selected')
            .find('.prompt-manager-select-action')
            .removeClass('fa-square-check')
            .addClass('fa-square');
          // 当前选中
          selectedPromptId = id;
          $thisPrompt.addClass('pm-selected');
          $(this).removeClass('fa-square').addClass('fa-square-check');
        }
      });

      $controls.prepend($span);
    });
  }

  // 核心替换工具箱函数
  function replace_toolbox() {
    observer.disconnect();
    const $prompts = $('.completion_prompt_manager_prompt');
    if (!$prompts.length) {
      observer.observe($('#completion_prompt_manager')[0], { childList: true, subtree: true });
      return;
    }
    ensureGlobalMoveButton();
    addSelectButton($prompts);
    observer.observe($('#completion_prompt_manager')[0], { childList: true, subtree: true });
  }

  const replace_toolbox_debounced = _.debounce(replace_toolbox, 500);
  const observer = new MutationObserver(replace_toolbox_debounced);

  $(() => {
    replace_toolbox();
  });

  $(window).on('pagehide', () => {
    replacePreset('in_use', getPreset('in_use'));
    observer.disconnect();
  });
})();
