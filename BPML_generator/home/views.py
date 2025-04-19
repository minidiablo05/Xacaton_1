from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def transcribe_audio(request):
    '''Основная функция обработки работы страницы сайта.'''

    if request.method == 'POST' and request.FILES.get('audio'):
        '''Здесь происходит обработка аудиофойла. Приходит фаил формата wmv.
        Возвращает текст в поле c id "userInput" для редактуры.
        '''

        # Делаем что-то с текстом (например, возвращаем его обратно)
        response_data = {
            'response': f'Вы прислали: это'
        }

        return JsonResponse(response_data)  # Отправляем JSON-ответ

    if request.method == 'POST' and request.body:
        '''Здесь происходит обработка текств. Приходит фаил формата json.
        Пока не возвращает ничего, надо смотреть что должно вернуть
        '''
        try:
            # Получаем JSON из тела запроса
            data = json.loads(request.body)
            received_text = data.get('text', '')  # Берём переданный текст

            # Делаем что-то с текстом (например, возвращаем его обратно)
            response_data = {
                'response': f'Вы прислали: {received_text}'
            }

            return JsonResponse(response_data)  # Отправляем JSON-ответ

        # Обработка ошибок
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return render(request, "transcribe_audio.html")
